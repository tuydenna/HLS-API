const amqp = require('amqplib');
const nodemailer = require('nodemailer');
require('dotenv').config();

const queue = 'emailQueue';

async function startWorker() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);

    let count = 1

    await channel.prefetch(1);
    await channel.consume(queue, async (msg) => {
        const {to, subject, text} = JSON.parse(msg.content.toString());
        console.log("start sending: ", count);
        try {
            await sendEmail(to, subject, text);
            console.log(`Finished sending to ${to}`);
            count++
            channel.ack(msg);
        } catch (err) {
            console.error('Failed to send email:', err);
        }
    });

    console.log('Worker listening for email jobs...');
}

function sendEmail(to, subject, text) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(to + subject + text);
        }, 1200 * 5)
    })
}

startWorker();
