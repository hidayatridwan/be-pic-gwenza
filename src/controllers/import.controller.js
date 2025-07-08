import importService from "../services/import.service.js";

const create = async (req, res, next) => {
  try {
    if (!req.file) {
      req.file = {};
    }
    req.file.channel = req.body.channel;

    const result = await importService.create(req.user, req.file);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await importService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search };
