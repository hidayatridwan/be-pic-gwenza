import { getChannel } from "../apps/rabbitmq.js";

const publish = async (queue, payload) => {
  const channel = await getChannel();
  await channel.assertQueue(queue, { durable: true });

  return channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
};

const subscribe = async (queue, handler) => {
  const channel = await getChannel();
  await channel.assertQueue(queue, { durable: true });

  return channel.consume(
    queue,
    async (msg) => {
      if (msg !== null) {
        const payload = JSON.parse(msg.content.toString());
        await handler(payload);
        channel.ack(msg);
      }
    },
    { noAck: false }
  );
};

export { publish, subscribe };
