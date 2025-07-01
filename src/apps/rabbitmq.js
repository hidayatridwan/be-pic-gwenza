import amqp from "amqplib";

let channel;

export const getChannel = async () => {
  if (channel) return channel;

  const connection = await amqp.connect(process.env.RABBITMQ_URL, {
    heartbeat: 10,
  });
  channel = await connection.createChannel();

  return channel;
};
