import amqplib, {Channel, ChannelModel, ConsumeMessage} from "amqplib"
import {File, PostStatus} from "@prisma/client";
import fragmentMp4ToFMp4 from "@lib/ffmpeg/ffmpeg-fragmentor";
import dotenv from "dotenv";
import {getStorageLink} from "@constant/path";
import PostService from "@services/PostService";

dotenv.config();

const queue = 'fragment_upload__queue';

async function startWorker() {
    const connection: ChannelModel = await amqplib.connect(process.env.RABBITMQ_URL);
    const channel: Channel = await connection.createChannel();
    await channel.assertQueue(queue);

    let count: number = 1;

    await channel.prefetch(1);
    await channel.consume(queue, async (msg: ConsumeMessage) => {
        const file: File & {postId: string} = JSON.parse(msg.content.toString());
        console.log("start fragmenting: ", count, file);
        try {
            fragmentMp4ToFMp4(getStorageLink(file.filePath), getStorageLink(file.dirPath));
            await new PostService().updatePostStatus(file.postId, PostStatus.PUBLISHED);
            console.log(`Finished fragmenting:`, file);
            count++;
            channel.ack(msg);
        } catch (err) {
            await new PostService().updatePostStatus(file.postId, PostStatus.ERROR);
            console.error('Failed to fragment upload:', err);
        }
    });

    console.log('Worker listening for fragment upload jobs...');
}

startWorker();
