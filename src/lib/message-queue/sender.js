#!/usr/bin/env node
const amqp = require('amqplib');

(async function sender() {

    const queue = 'task_queue';
    const msg = process.argv.slice(2).join(' ') || "Hello World!";
    console.log("msg", msg);
    try {
        const connection = await amqp.connect("amqp://localhost");
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, {
            durable: true,
            arguments: {
                'x-queue-type': 'quorum'
            }
        });

        channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });
        console.log(" [x] Sent '%s'", msg);

        setTimeout(function() {
            connection.close();
            process.exit(0)
        }, 500);
    } catch (err) {
        console.error(err);
    }
})()