import { generateQueryPlan } from "../utils/ai.query.js";
import { aiValidation } from "../validations/ai.validation.js";
import { validate } from "../validations/validation.js";

const ai = async (req) => {
    const aiRequest = validate(aiValidation, req);
    const question = aiRequest.question;

    return await generateQueryPlan(question);
};

export default { ai };