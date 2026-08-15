import mqlib, {Channel, ChannelModel} from "amqplib";
import env from "dotenv";
import SysLog from "@lib/logger/sys-log";
import {getEnv} from "@utils/index";
import amqplib from "amqplib";

env.config();

export const EXCHANGE_KEYS = {
    'SEGMENT_UPLOAD': 'SEGMENT_UPLOAD',
    'MIGRATE_STORAGE': 'MIGRATE_STORAGE',
    'CLEAR_STORAGE': 'CLEAR_STORAGE',
} as const;

class MQEventProducer {
    private static instance: MQEventProducer;
    private mq: Channel | null = null;

    private constructor() {}

    public static getInstance(): MQEventProducer {
        if (!MQEventProducer.instance) {
            MQEventProducer.instance = new MQEventProducer();
        }
        return MQEventProducer.instance;
    }

    public async connect() {
        try {
            const connection: ChannelModel = await mqlib.connect({
                vhost: getEnv("RABBITMQ_USERNAME"),
                hostname: getEnv("RABBITMQ_HOST"),
                username: getEnv("RABBITMQ_USERNAME"),
                password: getEnv("RABBITMQ_PASSWORD"),
                port: +getEnv("RABBITMQ_PORT"),
            });
            this.mq = await connection.createChannel();
            await this.mq.assertQueue(EXCHANGE_KEYS.SEGMENT_UPLOAD, {
                durable: true,
                arguments: {
                    'x-queue-type': 'quorum'
                }
            });
            await this.mq.assertQueue(EXCHANGE_KEYS.MIGRATE_STORAGE, {
                durable: true,
                arguments: {
                    'x-queue-type': 'quorum'
                }
            });
            await this.mq.assertQueue(EXCHANGE_KEYS.CLEAR_STORAGE, {
                durable: true,
                arguments: {
                    'x-queue-type': 'quorum'
                }
            });
            SysLog.success("[MQ Service]", "is connected successfully.");
        } catch (e) {
            SysLog.error("[MQ Service]", "failed to connect MQ Service!");
            throw new Error("failed to connect MQ Service!");
        }
    }

    private publish(exchange: string, data: any) {
        if (this.mq && this.mq.connection) {
           SysLog.success("MQ Producer", exchange, data);
            this.mq.sendToQueue(exchange, Buffer.from(JSON.stringify(data)), { persistent: true });
        } else {
            SysLog.error("[MQ Service]", "failed to connect MQ Service!");
            throw new Error("failed to connect MQ Service!");
        }
    }

    public sendMQSegmentUpload(data: any) {
        this.publish(EXCHANGE_KEYS.SEGMENT_UPLOAD, data);
    }

    public sendMQMigrateS3Storage(data: any) {
        this.publish(EXCHANGE_KEYS.MIGRATE_STORAGE, data);
    }

    public sendMQClearStorage(data: any) {
        this.publish(EXCHANGE_KEYS.CLEAR_STORAGE, data);
    }

    public getMQ(): Channel {
        return this.mq;
    }
}

const mqEventProducer: MQEventProducer = MQEventProducer.getInstance();

export { mqEventProducer };
