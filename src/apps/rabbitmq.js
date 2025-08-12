import amqp from "amqplib";

let connection;
let channel;

const connect = async () => {
  if (channel) return channel;

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL, {
      heartbeat: 10,
    });

    // Handle connection errors
    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      connection = null;
      channel = null;
    });

    // Handle connection close
    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
      connection = null;
      channel = null;
    });

    channel = await connection.createChannel();

    return channel;
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err);
    throw err;
  }
};

export const getChannel = async () => {
  if (!channel) {
    channel = await connect();
  }
  return channel;
};

export const closeConnection = async () => {
  if (connection) {
    await connection.close();
    connection = null;
    channel = null;
  }
};