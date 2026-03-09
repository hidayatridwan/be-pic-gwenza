import aiService from "../services/ai.service.js";

const ai = async (req, res, next) => {
  try {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Important! Send headers immediately

    await aiService.streamAiResponse(req.body, res);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

export default { ai };
