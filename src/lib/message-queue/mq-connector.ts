import mqlib, {Channel} from "amqplib";
import env from "dotenv";
import SysLog from "@lib/logger/sys-log";
env.config();

const exchangeKey: string = 'FRAGMENT_UPLOAD';
let MQ: Channel;

async function connectRabbitMQ() {
    try {
        const connection = await mqlib.connect(process.env.RABBITMQ_URL);
        MQ = await connection.createChannel();
        await MQ.assertExchange(exchangeKey, "fanout", {durable: false});
        SysLog.success("[MQ Service]", "is connected successfully.");
    } catch (e) {
        SysLog.error("[MQ Service]", "failed to connect MQ Service!");

    }
}

function sendMQ(data: any) {
    if (MQ && MQ.connection) {
        MQ.publish(exchangeKey,"" ,Buffer.from(JSON.stringify(data)));
    } else {
        SysLog.error("[MQ Service]", "failed to connect MQ Service!");
    }
}

export {connectRabbitMQ, MQ, sendMQ};

