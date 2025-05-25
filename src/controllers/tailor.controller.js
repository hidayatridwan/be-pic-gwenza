import tailorService from "../services/tailor.service.js";

const create = async (req, res, next) => {
  try {
    const result = await tailorService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await tailorService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const tailorId = parseInt(req.params.tailorId);
    const result = await tailorService.search(tailorId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.tailor_id = parseInt(req.params.tailorId);
    const result = await tailorService.update(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const tailorId = parseInt(req.params.tailorId);
    const result = await tailorService.remove(tailorId);
    res.status(204).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search, get, update, remove };
