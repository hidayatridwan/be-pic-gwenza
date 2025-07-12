import reportService from "../services/report.service.js";

const byProducts = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await reportService.byProducts(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const byPIC = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await reportService.byPIC(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const byTailors = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
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

const byMerchandiseSummary = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await reportService.byMerchandiseSummary(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const byMerchandiseDate = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await reportService.byMerchandiseDate(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { byProducts, byPIC, byTailors, byExpiredDate, byMerchandiseSummary, byMerchandiseDate };
