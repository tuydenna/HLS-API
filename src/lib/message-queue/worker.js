const amqp = require('amqplib');

(async function sender() {
    const queue = 'task_queue';
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, {
        durable: true,
        arguments: {
            'x-queue-type': 'quorum'
        }
    });

    await channel.prefetch(1);

    await channel.consume(queue, function (msg) {
        const secs = 90000;

        console.log(" [x] Received %s message:", msg.fields.deliveryTag, msg.content.toString());
        setTimeout(function () {
            console.log("Completed Message: " + msg.fields.deliveryTag);
            channel.ack(msg);
        }, secs);
    }, {
        // automatic acknowledgment mode,
        // see /docs/confirms for details
        noAck: false
    });
})();