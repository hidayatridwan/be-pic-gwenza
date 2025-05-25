import productService from "../services/product.service.js";

const search = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await productService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { search };
