import colorService from "../services/color.service.js";

const create = async (req, res, next) => {
  try {
    const result = await colorService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await colorService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const colorId = Number(req.params.colorId);
    const result = await colorService.get(colorId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.color_id = Number(req.params.colorId);
    const result = await colorService.update(req.user, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search, get, update };
