import amqplib, {Channel, ChannelModel, ConsumeMessage, Replies} from "amqplib"
import {File, PostStatus} from "@prisma/client";
import fragmentMp4ToFMp4 from "@lib/ffmpeg/ffmpeg-fragmentor";
import dotenv from "dotenv";
import {getStorageLink} from "@constant/path";
import PostService from "@services/PostService";
import {IHSLResponse} from "@interfaces/stream";
import SysLog from "@lib/logger/sys-log";
import AssertQueue = Replies.AssertQueue;

dotenv.config();

const exchangeKey = 'FRAGMENT_UPLOAD';

async function MQWorker() {
    const connection: ChannelModel = await amqplib.connect(process.env.RABBITMQ_URL);
    const channel: Channel = await connection.createChannel();
    await channel.assertExchange(exchangeKey, "fanout", {durable: false});
    const queue: AssertQueue = await channel.assertQueue("", {exclusive: true});
    await channel.bindQueue(queue.queue, exchangeKey, "")

    let count: number = 1;

    await channel.prefetch(1);
    await channel.consume(queue.queue, async (msg: ConsumeMessage) => {
        const file: File & {postId: string} = JSON.parse(msg.content.toString());
        SysLog.success("[MQ Consumer]", "start fragmenting ", "num: " + count, "message:", file);
        try {
            const {duration, quality}: IHSLResponse = await fragmentMp4ToFMp4(getStorageLink(file.filePath), getStorageLink(file.dirPath));
            await new PostService().updatePostFromQueue(file.postId, {status: PostStatus.PUBLISHED, duration, quality});
            count++;
            SysLog.success("[MQ Consumer]", `Finished fragmenting`, "message:", file, "duration: "+duration, "quality:", quality);
            channel.ack(msg);
        } catch (err) {
            await new PostService().updatePostFromQueue(file.postId, {status: PostStatus.ERROR});
            SysLog.error("[MQ Consumer]", 'Failed to fragment upload', err);
            channel.ack(msg);
        }
    },
        {
            noAck: false,
        });

    channel.on('close', () => {
        SysLog.error("[MQ Channel]", "is closed")
        // Re-create the channel or handle the error
    });

    channel.on('error', (err) => {
        SysLog.error("[MQ Channel]", "is error", err);
    });

    connection.on('close', (err) => {
        console.error('[MQ Connection]', "is closed", err);
    });

    connection.on('error', (err) => {
        console.error('[MQ Connection]', "is error", err);
    });

    SysLog.success("[MQ Worker]", "listening for fragment upload jobs...");
}

MQWorker();
