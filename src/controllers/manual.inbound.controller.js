import manualInboundService from "../services/manual.inbound.service.js";

const create = async (req, res, next) => {
  try {
    const result = await manualInboundService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await manualInboundService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getAdjustmentValue = async (req, res, next) => {
  try {
    const result = await manualInboundService.getAdjustmentValue(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  search,
  getAdjustmentValue
};
