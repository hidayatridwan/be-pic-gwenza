import aiService from "../services/ai.service.js";

const ai = async (req, res, next) => {
  try {
    const result = await aiService.ai(req.body);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export default { ai };
