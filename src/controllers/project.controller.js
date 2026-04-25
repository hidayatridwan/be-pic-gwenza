import projectService from "../services/project.service.js";

const create = async (req, res, next) => {
  try {
    const result = await projectService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    await projectService.cancel(projectId);
    res.status(204).json({});
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await projectService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const projectItems = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const result = await projectService.projectItems(projectId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const productItems = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const result = await projectService.productItems(productId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const products = async (req, res, next) => {
  try {
    const result = await projectService.products();
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const cancelItem = async (req, res, next) => {
  try {
    const projectItemId = Number(req.params.projectItemId);
    await projectService.cancelItem(projectItemId);
    res.status(204).json({});
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  cancel,
  search,
  projectItems,
  productItems,
  products,
  cancelItem
};
