import supplierService from "../services/supplier.service.js";

const create = async (req, res, next) => {
  try {
    const result = await supplierService.create(req.user, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const search = async (req, res, next) => {
  try {
    req.query.page = Number(req.query.page);
    req.query.size = Number(req.query.size);
    const result = await supplierService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const supplierId = Number(req.params.supplierId);
    const result = await supplierService.get(supplierId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    req.body.supplier_id = Number(req.params.supplierId);
    const result = await supplierService.update(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { create, search, get, update };
