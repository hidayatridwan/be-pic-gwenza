import userService from "../services/user.service.js";

const register = async (req, res, next) => {
  try {
    const result = await userService.register(req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body, res);
    res.status(200).json({
      data: { token: result },
    });
  } catch (e) {
    next(e);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req);
    res.status(200).json({
      data: { token: result },
    });
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res, next) => {
  try {
    await userService.logout(req, res);
    res.status(204).json({});
  } catch (e) {
    next(e);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await userService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { register, login, refreshToken, logout, search };
