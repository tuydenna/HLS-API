import amqplib, {Channel, ChannelModel, ConsumeMessage} from "amqplib";
import { File, PostStatus } from "@prisma/client";
import fragmentMp4ToFMp4 from "@lib/ffmpeg/ffmpeg-fragmentor";
import dotenv from "dotenv";
import { getStorageLink } from "@constant/path";
import PostService from "@services/PostService";
import { IHSLResponse } from "@interfaces/stream";
import SysLog from "@lib/logger/sys-log";
import { getEnv } from "@utils/index";
import {EXCHANGE_KEYS, mqEventProducer} from "@lib/message-queue/mq-event-producer";

dotenv.config();

class DataProcessorWorker {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private postService: PostService;

    constructor() {
        this.postService = new PostService();
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
        this.connection = await amqplib.connect(getEnv("RABBITMQ_URL"));
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

        // await this.channel.assertExchange(EXCHANGE_NAME, "fanout", { durable: false });
        // const { queue } = await this.channel.assertQueue("", { exclusive: true });
        // await this.channel.bindQueue(queue, EXCHANGE_NAME, "");

        await this.channel.prefetch(2);
        await this.channel.consume(EXCHANGE_KEYS.SEGMENT_UPLOAD, (msg) => this.segmentUploadData(msg), { noAck: false });
        await this.channel.consume(EXCHANGE_KEYS.MIGRATE_STORAGE, (msg) => this.migrateSegmentDataToStorage(msg), { noAck: false });
    }

    private async segmentUploadData(msg: ConsumeMessage | null): Promise<void> {
        if (!msg || !this.channel) {
            return;
        }

        const file: File & { postId: string } = JSON.parse(msg.content.toString());
        SysLog.success("[MQ Consumer]", "Starting to process message:", file);

        try {
            const { duration, quality }: IHSLResponse = await fragmentMp4ToFMp4(
                getStorageLink(file.filePath),
                getStorageLink(file.dirPath)
            );

            await this.postService.updatePostFromQueue(file.postId, {
                status: PostStatus.PUBLISHED,
                duration,
                quality,
            });

            SysLog.success("[MQ Consumer]", `Finished fragmenting`, "message:", file, "duration:", duration, "quality:", quality);
            mqEventProducer.sendMQMigrateS3Storage(file);
            // this.channel.sendToQueue(EXCHANGE_KEYS.MIGRATE_STORAGE, Buffer.from(JSON.stringify(file)), { persistent: true })
            this.channel.ack(msg);
        } catch (err) {
            SysLog.error("[MQ Consumer]", 'Failed to fragment upload', err, "for message:", file);
            await this.postService.updatePostFromQueue(file.postId, { status: PostStatus.ERROR });
            this.channel.ack(msg); // Acknowledge even on failure to prevent requeueing loops for poison messages.
        }
    }

    private async migrateSegmentDataToStorage(msg: ConsumeMessage | null): Promise<void> {
        if (!msg || !this.channel) {
            return;
        }

        const file: File & { postId: string } = JSON.parse(msg.content.toString());

        console.log("migrateSegmentDataToStorage", file);
        // SysLog.success("[MQ Consumer]", "Starting to process message:", file);
        //
        // try {
        //     const { duration, quality }: IHSLResponse = await fragmentMp4ToFMp4(
        //         getStorageLink(file.filePath),
        //         getStorageLink(file.dirPath)
        //     );
        //
        //     await this.postService.updatePostFromQueue(file.postId, {
        //         status: PostStatus.PUBLISHED,
        //         duration,
        //         quality,
        //     });
        //
        //     SysLog.success("[MQ Consumer]", `Finished fragmenting`, "message:", file, "duration:", duration, "quality:", quality);
        //     this.channel.ack(msg);
        // } catch (err) {
        //     SysLog.error("[MQ Consumer]", 'Failed to fragment upload', err, "for message:", file);
        //     await this.postService.updatePostFromQueue(file.postId, { status: PostStatus.ERROR });
        //     this.channel.ack(msg); // Acknowledge even on failure to prevent requeueing loops for poison messages.
        // }
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
