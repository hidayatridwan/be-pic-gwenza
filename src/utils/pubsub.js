import { logger } from "../apps/logging.js";
import { getChannel } from "../apps/rabbitmq.js";

const publish = async (queue, payload, options = {}) => {
  let channel;
  try {
    channel = await getChannel();

    // Assert queue with additional options if needed
    await channel.assertQueue(queue, {
      durable: true,
      ...options.queueOptions
    });

    const success = channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        ...options.messageOptions
      }
    );

    if (!success) {
      throw new Error("Message could not be sent to queue - possibly due to backpressure");
    }

    return success;
  } catch (err) {
    console.error(`Failed to publish message to queue ${queue}:`, err);
    throw err;
  }
};

const subscribe = async (queue, handler, options = {}) => {
  let channel;
  try {
    channel = await getChannel();

    // Assert queue with configuration
    await channel.assertQueue(queue, {
      durable: true,
      ...options.queueOptions
    });

    // Set prefetch to control how many messages are processed concurrently
    const prefetchCount = options.prefetch || 5;
    await channel.prefetch(prefetchCount);

    const consumer = await channel.consume(
      queue,
      async (msg) => {
        if (!msg) {
          // Message is null when the consumer is cancelled
          if (options.onCancel) options.onCancel();
          return;
        }

        try {
          const payload = JSON.parse(msg.content.toString());
          await handler(payload);
          channel.ack(msg);
        } catch (err) {
          logger.error(`Error processing message from ${queue}:`, err);

          // Handle message processing failure
          if (options.onError) {
            await options.onError(err, msg);
          } else {
            // Default behavior: nack with requeue based on configuration
            channel.nack(msg, false, options.requeueOnError !== false);
          }
        }
      },
      {
        noAck: false,
        ...options.consumeOptions
      }
    );

    // Return consumer tag and a function to cancel the subscription
    return {
      consumerTag: consumer.consumerTag,
      cancel: async () => {
        if (channel) {
          await channel.cancel(consumer.consumerTag);
          if (options.onCancel) options.onCancel();
        }
      }
    };

  } catch (err) {
    logger.error(`Failed to subscribe to queue ${queue}:`, err);

    // Clean up channel if it was created but an error occurred
    if (channel) {
      try {
        await channel.close();
      } catch (closeErr) {
        logger.error('Error closing channel:', closeErr);
      }
    }

    throw err;
  }
};

const sendToDlq = async (msg, dlqName) => {
  try {
    // Default DLQ name if not provided
    const queue = dlqName || `${msg.fields.routingKey || 'unknown'}.dlq`;

    // Try to parse original payload
    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch {
      // If parsing fails, wrap raw content in object
      payload = { raw: msg.content.toString() };
    }

    // Optionally store error metadata
    const dlqPayload = {
      ...payload,
      _dlqMeta: {
        originalQueue: msg.fields.routingKey,
        exchange: msg.fields.exchange,
        redelivered: msg.fields.redelivered,
        timestamp: new Date().toISOString()
      }
    };

    // Publish to DLQ
    await publish(queue, dlqPayload, {
      queueOptions: { durable: true },
      messageOptions: { persistent: true }
    });

    logger.log(`Message sent to DLQ: ${queue}`);
  } catch (err) {
    logger.error("Failed to send message to DLQ:", err);
  }
}

export { publish, subscribe, sendToDlq };
