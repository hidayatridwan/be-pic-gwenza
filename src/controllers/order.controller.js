import orderService from "../services/order.service.js";

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await orderService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const summary = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await orderService.summary(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { search, summary };
