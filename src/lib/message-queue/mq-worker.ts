import amqplib, {Channel, ChannelModel, ConsumeMessage} from "amqplib";
import { File, PostStatus } from "@prisma/client";
import {fragmentMp4ToFMp4} from "@lib/ffmpeg/ffmpeg-fragmentor";
import dotenv from "dotenv";
import PostService from "@services/PostService";
import { IHSLResponse } from "@interfaces/stream";
import SysLog from "@lib/logger/sys-log";
import { getEnv } from "@utils/index";
import {EXCHANGE_KEYS} from "@lib/message-queue/mq-event-producer";
import FileService from "@services/FileService";
import StorageEngine from "@services/StorageEngine";

dotenv.config();

class DataProcessorWorker {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private postService: PostService;
    private fileService: FileService;

    constructor() {
        this.postService = new PostService();
        this.fileService = new FileService();
    }

    public async start(): Promise<void> {
        try {
            await this.connect();
            await this.setupConsumer();
            SysLog.success("[MQ Worker]", "Listening for fragment upload jobs...");
        } catch (error) {
            SysLog.error("[MQ Worker]", "Failed to start worker", error);
            this.handleDisconnect("[MQ Worker]");
        }
    }

    private async connect(): Promise<void> {
        this.connection = await amqplib.connect({
            vhost: getEnv("RABBITMQ_USERNAME"),
            hostname: getEnv("RABBITMQ_HOST"),
            username: getEnv("RABBITMQ_USERNAME"),
            password: getEnv("RABBITMQ_PASSWORD"),
            port: +getEnv("RABBITMQ_PORT"),
        });
        this.connection.on('close', () => this.handleDisconnect("[MQ Connection]"));
        this.connection.on('error', (err) => SysLog.error("[MQ Connection]", "Connection error", err));

        this.channel = await this.connection.createChannel();
        this.channel.on('close', () => SysLog.error("[MQ Channel]", "Channel closed."));
        this.channel.on('error', (err) => SysLog.error("[MQ Channel]", "Channel error", err));
    }

    private async setupConsumer(): Promise<void> {
        if (!this.channel) {
            throw new Error("Channel is not available for setting up consumer.");
        }

        await this.channel.assertQueue(EXCHANGE_KEYS.SEGMENT_UPLOAD, {
            durable: true,
            arguments: {
                'x-queue-type': 'quorum'
            }
        });
        await this.channel.assertQueue(EXCHANGE_KEYS.MIGRATE_STORAGE, {
            durable: true,
            arguments: {
                'x-queue-type': 'quorum'
            }
        });
        await this.channel.assertQueue(EXCHANGE_KEYS.CLEAR_STORAGE, {
            durable: true,
            arguments: {
                'x-queue-type': 'quorum'
            }
        });

        await this.channel.prefetch(2);
        await this.channel.consume(EXCHANGE_KEYS.SEGMENT_UPLOAD, (msg) => this.segmentUploadData(msg), { noAck: false });
        await this.channel.consume(EXCHANGE_KEYS.MIGRATE_STORAGE, (msg) => this.migrateSegmentDataToStorage(msg), { noAck: false });
        await this.channel.consume(EXCHANGE_KEYS.CLEAR_STORAGE, (msg) => this.clearStorage(msg), { noAck: false });
    }

    private async segmentUploadData(msg: ConsumeMessage | null): Promise<void> {
        if (!msg || !this.channel) {
            return;
        }

        const file: File & { postId: string } = JSON.parse(msg.content.toString());
        SysLog.success("MQ Worker", msg.fields.routingKey, file);

        try {
            const { duration, quality, hasAudio }: IHSLResponse = await fragmentMp4ToFMp4(
                file.filePath,
                // getStorageLink(file.dirPath)
            );

            console.log("{ duration, quality, hasAudio }", { duration, quality, hasAudio })

            await this.postService.updatePostFromQueue(file.postId, {
                status: PostStatus.PENDING,
                duration,
                hasAudio,
                quality,
            });

            // SysLog.success("[MQ Consumer]", `Finished fragmenting`, "message:", file, "duration:", duration, "quality:", quality);
            this.channel.sendToQueue(EXCHANGE_KEYS.MIGRATE_STORAGE, Buffer.from(JSON.stringify(file)), { persistent: true })
            this.channel.ack(msg);
        } catch (err) {
            SysLog.error("[MQ Consumer]", 'Failed to fragment upload', err, "for message:", file);
            await this.postService.updatePostFromQueue(file.postId, { status: PostStatus.ERROR });
            this.channel.ack(msg); // Acknowledge even on failure to prevent requeueing loops for poison messages.
        }
    }

    private async migrateSegmentDataToStorage(msg: ConsumeMessage | null): Promise<void> {
        if (!msg || !this.channel) {
            SysLog.error("Storage Worker", "msg is null");
            return;
        }
        const file: File & { postId: string } = JSON.parse(msg.content.toString());
        try {
            SysLog.success("MQ Worker", msg.fields.routingKey, file);
            await this.fileService.migrateVideoToR2V2(file.dirPath, file.dirPath);
            await this.postService.updatePostFromQueue(file.postId, {
                status: PostStatus.PUBLISHED
            });

            StorageEngine.remove(file.dirPath);
            this.channel.ack(msg);
        } catch (e) {
            SysLog.error("Storage Worker", e);
            await this.postService.updatePostFromQueue(file.postId, { status: PostStatus.ERROR });
            this.channel.ack(msg);
        }
    }

    private async clearStorage(msg: ConsumeMessage | null): Promise<void> {
        if (!msg || !this.channel) {
            SysLog.error("Storage Worker", "msg is null");
            return;
        }
        const file: File & { postId: string } = JSON.parse(msg.content.toString());
        try {
            SysLog.success("MQ Worker", msg.fields.routingKey, file);
            await this.fileService.deleteDir(file.dirPath);
            this.channel.ack(msg);
        } catch (e) {
            SysLog.error("Storage Worker", e);
            this.channel.ack(msg);
        }
    }

    private handleDisconnect(source: string): void {
        SysLog.error(source, "is closed. Attempting to reconnect in 5 seconds...");
        this.channel = null;
        this.connection = null;
        setTimeout(() => this.start(), 5000);
    }
}

const worker = new DataProcessorWorker();
worker.start();
