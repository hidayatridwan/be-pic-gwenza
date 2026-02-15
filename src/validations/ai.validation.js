import Joi from "joi";

const aiValidation = Joi.object({
    question: Joi.string().max(512).required(),
});

export {
    aiValidation
};
