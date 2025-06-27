import express from "express";
import cors from "cors";
import { router as publicRouter } from "../routes/public.api.js";
import { router as authRouter } from "../routes/auth.api.js";
import { errorMiddleware } from "../middlewares/error.middleware.js";
import cookieParser from "cookie-parser";

export const web = express();

web.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

web.use(express.json({ limit: "50mb" }));
web.use(cookieParser());
web.use(publicRouter);
web.use(authRouter);
web.use(errorMiddleware);
