import Jwt from "jsonwebtoken";
import constants from "../utils/constants.js";

const authMiddleware = (req, res, next) => {
  const token = req.get("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: constants.UNAUTHORIZED }).end();
  }

  Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: constants.INVALID_TOKEN }).end();
    }

    req.user = decoded;
    next();
  });
};

export { authMiddleware };
