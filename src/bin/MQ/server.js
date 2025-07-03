const express = require('express');
const amqp = require('amqplib');
require('dotenv').config();

const app = express();
app.use(express.json());

const queue = 'emailQueue';
let channel;

async function connectRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(queue);
}

app.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;
    const msg = { to, subject, text };

    if (!channel) {
        return res.status(500).send('RabbitMQ not connected');
    }

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
    res.send('Email job sent to queue!');
});

app.listen(4000, async () => {
    await connectRabbitMQ();
    console.log('Producer running on http://localhost:4000');
});
