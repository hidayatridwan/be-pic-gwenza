import inboundService from "../services/inbound.service.js";

const create = async (req, res, next) => {
  try {
    const result = await inboundService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const inboundId = Number(req.params.inboundId);
    await inboundService.cancel(inboundId);
    res.status(204).json({});
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await inboundService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, cancel, search };
