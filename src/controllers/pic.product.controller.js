import picProductService from "../services/pic.product.service.js";

const create = async (req, res, next) => {
  try {
    const result = await picProductService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export default { create };
