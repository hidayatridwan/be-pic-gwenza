import merchandiseService from "../services/merchandise.service.js";

const create = async (req, res, next) => {
  try {
    const result = await merchandiseService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await merchandiseService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const merchandiseId = parseInt(req.params.merchandiseId);
    const result = await merchandiseService.get(merchandiseId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.merchandise_id = parseInt(req.params.merchandiseId);
    const result = await merchandiseService.update(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search, get, update };
