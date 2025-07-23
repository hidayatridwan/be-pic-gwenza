import productService from "../services/product.service.js";

const create = async (req, res, next) => {
  try {
    const result = await productService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await productService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const result = await productService.get(productId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.product_id = Number(req.params.productId);
    const result = await productService.update(req.user, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search, get, update };
