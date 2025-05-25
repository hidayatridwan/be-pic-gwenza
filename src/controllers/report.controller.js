import reportService from "../services/report.service.js";

const search = async (req, res, next) => {
  try {
    const result = await reportService.search(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { search };
