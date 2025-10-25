import { prisma } from '../config/db.js'
import {
    comparePassword,
    generateAcessToken,
    hashPassword,
    setTokenCookies,
} from '../utils/authUtils.js'
import { signUpValidator } from '../validation/userValidation.js'

export const signUp = async (req, res) => {
    const data = req.body
    console.log(data)

    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in enough fiels',
            })
        }

        await signUpValidator.validateAsync(data)

        const checkEmail = await prisma.user.findUnique({
            where: { email: data.email },
        })

        if (checkEmail) {
            return res
                .status(409)
                .json({ success: false, message: 'Email existed.' })
        }

        const hashedPassword = await hashPassword(data.password)

        const newUser = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
            },
            include: {
                badges: true,
                notifications: true,
                tasks: { include: { subtasks: true } },
                daily_task_record: { include: { tasks: true } },
                level: true,
            },
        })

        // Generate tokens
        const accessToken = generateAcessToken(newUser.id)
        const refreshToken = generateAcessToken(newUser.id)

        // Set cookies
        setTokenCookies(res, accessToken, refreshToken)

        return res.status(200).json({
            success: true,
            message: 'Sign up successfully',
            data: {
                newUser,
                accessToken,
            },
        })
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({
                success: false,
                message: error.details.map((err) => err.message),
            })
        }
        console.error('Error signing up: ', error)
        return res
            .status(500)
            .json({ success: false, message: 'Internal Server Error' })
    }
}

export const signIn = async (req, res) => {
    const { email, password } = req.body
    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in enough fields.',
            })
        }

        const user = await prisma.user.findFirst({
            where: {
                email: email,
            },
            include: {
                badges: true,
                notifications: true,
                tasks: { include: { subtasks: true } },
                daily_task_record: { include: { tasks: true } },
                level: true,
            },
        })

        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: 'User not founded.' })
        }

        const isPasswordValid = await comparePassword(password, user.password)
        if (!isPasswordValid) {
            return res
                .status(406)
                .json({ success: false, message: 'Wrong password.' })
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() },
        })

        // Generate tokens
        const accessToken = generateAcessToken(user.id)
        const refreshToken = generateAcessToken(user.id)

        // Set cookies
        setTokenCookies(res, accessToken, refreshToken)

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user

        res.status(200).json({
            success: true,
            message: 'Sign in successfully',
            data: {
                user: userWithoutPassword,
                accessToken,
            },
        })
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({
                success: false,
                message: error.details.map((err) => err.message),
            })
        }
        console.error('Error signing up: ', error)
        return res
            .status(500)
            .json({ success: false, message: 'Internal Server Error' })
    }
}
