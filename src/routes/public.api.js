import express from "express";
import userController from "../controllers/user.controller.js";

const router = express.Router();

router.get("/health-check", (req, res) => {
  res.status(200).send({ message: "This api is healthyy." });
});
router.post("/users", userController.register);
router.post("/users/login", userController.login);
router.get("/users/refresh-token", userController.refreshToken);
router.get("/users/logout", userController.logout);

export { router };
