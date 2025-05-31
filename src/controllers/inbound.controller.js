import inboundService from "../services/inbound.service.js";

const create = async (req, res, next) => {
  try {
    const result = await inboundService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const inboundId = parseInt(req.params.inboundId);
    await inboundService.reject(inboundId);
    res.status(204).json({});
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await inboundService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, reject, search };
