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
    const projectId = parseInt(req.params.projectId);
    await projectService.cancel(projectId);
    res.status(204).json({});
  } catch (err) {
    next(err);
  }
};

const searchProject = async (req, res, next) => {
  try {
    req.query.page = parseInt(req.query.page);
    req.query.size = parseInt(req.query.size);
    const result = await projectService.searchProject(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getItemByProjectId = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const result = await projectService.getItemByProjectId(projectId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  cancel,
  searchProject,
  getItemByProjectId,
};
