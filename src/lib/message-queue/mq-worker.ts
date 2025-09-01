import amqplib, {Channel, ChannelModel, ConsumeMessage} from "amqplib"
import {File, PostStatus} from "@prisma/client";
import fragmentMp4ToFMp4 from "@lib/ffmpeg/ffmpeg-fragmentor";
import dotenv from "dotenv";
import {getStorageLink} from "@constant/path";
import PostService from "@services/PostService";
import {IPlaylist} from "@interfaces/stream";
import SysLog from "@lib/logger/sys-log";

dotenv.config();

const exchangeKey = 'FRAGMENT_UPLOAD';

async function MQWorker() {
    const connection: ChannelModel = await amqplib.connect(process.env.RABBITMQ_URL);
    const channel: Channel = await connection.createChannel();
    await channel.assertExchange(exchangeKey, "fanout", {durable: false});
    const queue = await channel.assertQueue("", {exclusive: true});
    await channel.bindQueue(queue.queue, exchangeKey, "")

    let count: number = 1;

    await channel.prefetch(1);
    await channel.consume(queue.queue, async (msg: ConsumeMessage) => {
        const file: File & {postId: string} = JSON.parse(msg.content.toString());
        console.log("start fragmenting: ", count, file);
        try {
            const playList: IPlaylist = fragmentMp4ToFMp4(getStorageLink(file.filePath), getStorageLink(file.dirPath));
            await new PostService().updatePostFromQueue(file.postId, {status: PostStatus.PUBLISHED, duration: playList.duration});
            console.log(`Finished fragmenting:`, file);
            count++;
            channel.ack(msg);
        } catch (err) {
            await new PostService().updatePostFromQueue(file.postId, {status: PostStatus.ERROR});
            console.error('Failed to fragment upload:', err);
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

    console.log('Worker listening for fragment upload jobs...');
}

MQWorker();
