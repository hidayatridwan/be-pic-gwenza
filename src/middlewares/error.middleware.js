import { ResponseError } from "../errors/response.error.js";

const errorMiddleware = (err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  if (err instanceof ResponseError) {
    res.status(err.status).json({ message: err.message }).end();
  } else {
    res.status(500).json({ message: err.message }).end();
  }
};

export { errorMiddleware };
