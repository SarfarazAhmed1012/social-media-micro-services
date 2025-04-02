const amqp = require('amqplib')
const logger = require('./logger')

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'post-exchange'

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel = await connection.createChannel()
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false })

        logger.info('Connected to RabbitMQ')
        return channel
    } catch (error) {
        logger.error(error.message)
    }
}

async function publishEvent(routingKey, message) {
    try {
        if (!channel) {
            await connectRabbitMQ()
        }

        await channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
    }
    catch (error) {
        logger.error(error.message)
    }
}

async function consumeEvent(routingKey, callback) {
    if (!channel) {
        await connectRabbitMQ()
    }

    const q = await channel.assertQueue("", { exclusive: true })
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey)
    channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            const content = JSON.parse(msg.content.toString())
            callback(content)
            channel.ack(msg)
        }
    })

    logger.info(`Waiting for ${routingKey} events...`)
}

module.exports = { connectRabbitMQ, publishEvent, consumeEvent }