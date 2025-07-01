import fashionDesignService from "../services/fashion.design.service.js";

const create = async (req, res, next) => {
  try {
    if (!req.files) {
      req.files = {};
    }
    req.body.sample_file = req.files?.sample_file?.[0].key || "";
    req.body.revision_file = req.files?.revision_file?.[0].key || "";

    const result = await fashionDesignService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await fashionDesignService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.fashiondesign_id = parseInt(req.params.fashionDesignId);
    if (!req.files) {
      req.files = {};
    }
    req.body.sample_file = req.files?.sample_file?.[0].key || "";
    req.body.revision_file = req.files?.revision_file?.[0].key || "";
    const result = await fashionDesignService.update(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const fashionDesignId = parseInt(req.params.fashionDesignId);
    const result = await fashionDesignService.remove(fashionDesignId);
    res.status(204).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search, update, remove };
