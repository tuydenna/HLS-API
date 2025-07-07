import mqlib, {Channel} from "amqplib";
import env from "dotenv";
env.config();

const queue: string = 'fragment_upload__queue';
let MQ: Channel;

async function connectRabbitMQ() {
    const connection = await mqlib.connect(process.env.RABBITMQ_URL);
    MQ = await connection.createChannel();
    await MQ.assertQueue(queue);
    console.log("[MQ]: is connected");
}

function sendMQ(queue: string,  data: any) {
    MQ.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
}

export {connectRabbitMQ, MQ, sendMQ};

