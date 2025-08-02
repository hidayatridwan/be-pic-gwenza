import merchandiseService from "../services/merchandise.service.js";

const create = async (req, res, next) => {
  try {
    if (!req.file) {
      req.file = {};
    }
    req.body.image = req.file?.key || "";
    const result = await merchandiseService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await merchandiseService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const merchandiseId = Number(req.params.merchandiseId);
    const result = await merchandiseService.get(merchandiseId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.merchandise_id = Number(req.params.merchandiseId);
    if (!req.file) {
      req.file = {};
    }
    req.body.image = req.file?.key || "";
    const result = await merchandiseService.update(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search, get, update };
