import variantService from "../services/variant.service.js";

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

export default { search };
