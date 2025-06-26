import reportService from "../services/report.service.js";

const byProducts = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await reportService.byProducts(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const byPIC = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await reportService.byPIC(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const byTailors = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await reportService.byTailors(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const byExpiredDate = async (req, res, next) => {
  try {
    const result = await reportService.byExpiredDate(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const bySummary = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await reportService.bySummary(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { byProducts, byPIC, byTailors, byExpiredDate, bySummary };
