import outboundService from "../services/outbound.service.js";

const create = async (req, res, next) => {
  try {
    const result = await outboundService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await outboundService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const outboundId = Number(req.params.outboundId);
    await outboundService.cancel(outboundId);
    res.status(204).json({});
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  search,
  cancel
};
