import express from "express";
import userController from "../controllers/user.controller.js";
import publisher from '../utils/rabbitmq/publisher.js';

const router = express.Router();

router.get("/health-check", async (req, res) => {
  // res.status(200).send({ message: "This api is healthy." });
  await publisher.publish(process.env.UPLOAD_ORDER_CREATED, {
    event: process.env.UPLOAD_ORDER_CREATED,
    data: { "name": "Ridwan" },
    timestamp: new Date().toISOString(),
  });
  res.status(200).send({ message: "sukses publisher.." });
});
router.post("/users", userController.register);
router.post("/users/login", userController.login);
router.get("/users/refresh-token", userController.refreshToken);
router.get("/users/logout", userController.logout);

export { router };
