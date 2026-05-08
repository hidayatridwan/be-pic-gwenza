import variantService from "../services/variant.service.js";

const create = async (req, res, next) => {
  try {
    const result = await variantService.create(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await variantService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const variantId = Number(req.params.variantId);
    const result = await variantService.get(variantId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.variant_id = Number(req.params.variantId);
    const result = await variantService.update(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const variantId = Number(req.params.variantId);
    const result = await variantService.remove(variantId);
    res.status(204).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search, get, update, remove };
