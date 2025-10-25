import Joi from 'joi'

export const signUpValidator = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email cannot be empty',
        'string.email': 'Invalid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string()
        .min(8)
        .pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
        .required()
        .messages({
            'any.required': 'Password is required',
            'string.empty': 'Password cannot be empty',
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base':
                'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
        }),
    confirm_password: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.required': 'Password confirmation is required',
            'any.only': 'Password confirmation does not match',
        }),
    role: Joi.string().optional(),
})

export const signInValidator = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email cannot be empty',
        'string.email': 'Invalid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required',
        'string.empty': 'Password cannot be empty',
    }),
})

export const changePasswordValidator = Joi.object({
    current_password: Joi.string().required().messages({
        'any.required': 'Current password is required',
        'string.empty': 'Current password cannot be empty',
    }),
    new_password: Joi.string()
        .min(8)
        .pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
        .required()
        .messages({
            'any.required': 'New password is required',
            'string.empty': 'New password cannot be empty',
            'string.min': 'New password must be at least 8 characters',
            'string.pattern.base':
                'New password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
        }),
    confirm_new_password: Joi.string()
        .valid(Joi.ref('new_password'))
        .required()
        .messages({
            'any.required': 'Password confirmation is required',
            'any.only': 'Password confirmation does not match',
        }),
})

export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false, // Lấy TẤT CẢ lỗi
        })

        if (error) {
            console.log(error)

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
