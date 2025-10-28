import Joi from 'joi'

export const createTaskValidator = Joi.object({
    name: Joi.string().required().min(1).max(200).messages({
        'string.empty': 'Task name cannot be empty',
        'any.required': 'Task name is required',
        'string.min': 'Task name must be at least 1 character',
        'string.max': 'Task name must not exceed 200 characters',
    }),
    note: Joi.string().allow('', null).optional(),
    category: Joi.array().items(Joi.string()).optional(),
    is_important: Joi.boolean().optional(),
    is_urgent: Joi.boolean().optional(),
    deadline: Joi.date().iso().required().messages({
        'any.required': 'Deadline is required',
        'date.base': 'Deadline must be a valid date',
    }),
    subtasks: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required().messages({
                    'any.required': 'Subtask name is required',
                    'string.empty': 'Subtask name cannot be empty',
                }),
                is_completed: Joi.boolean().optional(),
            })
        )
        .optional(),
})

export const updateTaskValidator = Joi.object({
    name: Joi.string().min(1).max(200).optional().messages({
        'string.min': 'Task name must be at least 1 character',
        'string.max': 'Task name must not exceed 200 characters',
    }),
    note: Joi.string().allow('', null).optional(),
    category: Joi.array().items(Joi.string()).optional(),
    is_important: Joi.boolean().optional(),
    is_urgent: Joi.boolean().optional(),
    deadline: Joi.date().iso().optional().messages({
        'date.base': 'Deadline must be a valid date',
    }),
    subtasks: Joi.array()
        .items(
            Joi.object({
                id: Joi.string().optional(), // Có id = update, không có = create
                name: Joi.string().required().messages({
                    'any.required': 'Subtask name is required',
                    'string.empty': 'Subtask name cannot be empty',
                }),
                is_completed: Joi.boolean().optional(),
            })
        )
        .optional(),
})

export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false, // Lấy TẤT CẢ lỗi
        })

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path[0],
                message: detail.message.replace(/['"]/g, ''),
            }))

            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors,
            })
        }

        next()
    }
}
