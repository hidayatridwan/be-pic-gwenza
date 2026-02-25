import express from "express";
import userController from "../controllers/user.controller.js";
import { prismaClient } from "../apps/database.js";
import rabbitmqConnection from "../apps/rabbitmq.js";

const router = express.Router();

router.get("/health-check", async (req, res) => {
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      mariadb: { status: "unknown" },
      rabbitmq: { status: "unknown" },
    },
  };

  // Check MariaDB connection
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    healthStatus.services.mariadb = { status: "ok" };
  } catch (error) {
    healthStatus.services.mariadb = { status: "error", message: error.message };
    healthStatus.status = "degraded";
  }

  // Check RabbitMQ connection
  try {
    if (rabbitmqConnection.isConnected) {
      healthStatus.services.rabbitmq = { status: "ok" };
    } else {
      // Try to get channel which will attempt connection
      await rabbitmqConnection.getChannel();
      healthStatus.services.rabbitmq = { status: "ok" };
    }
  } catch (error) {
    healthStatus.services.rabbitmq = { status: "error", message: error.message };
    healthStatus.status = "degraded";
  }

  const statusCode = healthStatus.status === "ok" ? 200 : 503;
  res.status(statusCode).send(healthStatus);
});
router.post("/users", userController.register);
router.post("/users/login", userController.login);
router.get("/users/refresh-token", userController.refreshToken);
router.get("/users/logout", userController.logout);

export { router };
