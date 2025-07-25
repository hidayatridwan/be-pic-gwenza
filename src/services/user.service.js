import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../validations/validation.js";
import {
  changePasswordValidation,
  loginUserValidation,
  registerUserValidation,
  searchUserValidation,
} from "../validations/user.validation.js";
import constants from "../utils/constants.js";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { hashToken } from "../utils/security.js";

const register = async (req) => {
  const registerRequest = validate(registerUserValidation, req);

  const countUser = await prismaClient.user.count({
    where: {
      username: registerRequest.username,
    },
  });

  if (countUser > 0) {
    throw new ResponseError(400, constants.RECORD_EXISTS);
  }

  registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

  return await prismaClient.user.create({
    data: registerRequest,
    select: {
      username: true,
      full_name: true,
      created_at: true,
    },
  });
};

const login = async (req, res) => {
  const loginRequest = validate(loginUserValidation, req);

  const user = await prismaClient.user.findUnique({
    where: {
      username: loginRequest.username,
    },
  });

  if (!user) {
    throw new ResponseError(401, constants.INVALID_CREDENTIALS);
  }

  const isValidPassword = await bcrypt.compare(
    loginRequest.password,
    user.password
  );

  if (!isValidPassword) {
    throw new ResponseError(401, constants.INVALID_CREDENTIALS);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const hashedRefreshToken = hashToken(refreshToken);
  await prismaClient.user.update({
    data: {
      token: hashedRefreshToken,
    },
    where: {
      user_id: user.user_id,
    },
  });

  res.cookie("token", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  });

  return accessToken;
};

const refreshToken = async (req) => {
  const refreshToken = req.cookies.token;
  if (!refreshToken) {
    throw new ResponseError(401, constants.INVALID_TOKEN);
  }

  let decoded;
  try {
    decoded = Jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (e) {
    console.error("Error verifying token:", e);
    throw new ResponseError(401, constants.INVALID_TOKEN);
  }

  const user = await prismaClient.user.findFirst({
    where: {
      user_id: decoded.user_id,
    },
  });

  if (!user) {
    throw new ResponseError(401, constants.INVALID_TOKEN);
  }

  return generateAccessToken(decoded);
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.token;
  if (!refreshToken) {
    throw new ResponseError(401, constants.INVALID_TOKEN);
  }

  let decoded;
  try {
    decoded = Jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (e) {
    console.error("Error verifying token:", e);
    throw new ResponseError(401, constants.INVALID_TOKEN);
  }

  await prismaClient.user.update({
    data: {
      token: null,
    },
    where: {
      user_id: decoded.user_id,
    },
  });

  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });
};

const generateAccessToken = async (user) => {
  const { user_id, username, full_name, role } = user;

  return Jwt.sign(
    { user_id, username, full_name, role },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "7m",
    }
  );
};

const generateRefreshToken = (user) => {
  const { user_id, username, full_name, role } = user;

  return Jwt.sign(
    { user_id, username, full_name, role },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "14d",
    }
  );
};

const search = async (req) => {
  const searchRequest = validate(searchUserValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  let where = {};
  if (searchRequest.search) {
    where = {
      OR: [
        {
          username: { contains: searchRequest.search },
        },
        {
          full_name: { contains: searchRequest.search },
        },
        {
          role_name: { contains: searchRequest.search },
        },
      ],
    };
  }

  const data = await prismaClient.user.findMany({
    where,
    take: searchRequest.size,
    skip: skip,
    select: {
      user_id: true,
      username: true,
      full_name: true,
      role: true,
      created_at: true,
    },
  });
  const total = await prismaClient.user.count({ where });

  return { data, total };
};

const changePassword = async (user, req) => {
  const changePasswordRequest = validate(changePasswordValidation, req);

  const userData = await prismaClient.user.findUnique({
    where: {
      username: user.username,
    },
  });

  if (!userData) {
    throw new ResponseError(401, constants.INVALID_CREDENTIALS);
  }

  const isValidPassword = await bcrypt.compare(
    changePasswordRequest.old_password,
    userData.password
  );

  if (!isValidPassword) {
    throw new ResponseError(401, constants.INVALID_CREDENTIALS);
  }

  // Update password
  const newPassword = await bcrypt.hash(changePasswordRequest.new_password, 10);
  return await prismaClient.user.update({
    where: {
      user_id: user.user_id,
    },
    data: {
      password: newPassword,
    }
  });
};

export default { register, login, refreshToken, logout, search, changePassword };
