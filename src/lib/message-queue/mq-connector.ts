import mqlib, {Channel} from "amqplib";
import env from "dotenv";
env.config();

const exchangeKey: string = 'FRAGMENT_UPLOAD';
let MQ: Channel;

async function connectRabbitMQ() {
    const connection = await mqlib.connect(process.env.RABBITMQ_URL);
    MQ = await connection.createChannel();
    await MQ.assertExchange(exchangeKey, "fanout", {durable: false});
    console.log("[MQ]: is connected");
}

function sendMQ(data: any) {
    MQ.publish(exchangeKey,"" ,Buffer.from(JSON.stringify(data)));
}

export {connectRabbitMQ, MQ, sendMQ};

