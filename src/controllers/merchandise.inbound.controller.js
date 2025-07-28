import merchandiseInboundService from "../services/merchandise.inbound.service.js";

const create = async (req, res, next) => {
  try {
    const result = await merchandiseInboundService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await merchandiseInboundService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const inboundCodes = async (req, res, next) => {
  try {
    const result = await merchandiseInboundService.inboundCodes(Number(req.params.merchandiseId));
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const merchandiseInboundId = Number(req.params.merchandiseInboundId);
    await merchandiseInboundService.cancel(merchandiseInboundId);
    res.status(204).json({});
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  search,
  inboundCodes,
  cancel
};
