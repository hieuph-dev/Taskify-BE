import { prisma } from '../config/db.js'
import {
    clearTokenCookies,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashPassword,
    setTokenCookies,
} from '../utils/authUtils.js'

export const signUp = async (req, res) => {
    const data = req.body
    console.log(data)

    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in enough fields',
            })
        }

        const checkEmail = await prisma.user.findUnique({
            where: { email: data.email },
        })

        if (checkEmail) {
            return res
                .status(409)
                .json({ success: false, message: 'Email existed.' })
        }

        const hashedPassword = await hashPassword(data.password)

        const user = await prisma.user.create({
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
        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)

        // Set cookies
        setTokenCookies(res, accessToken, refreshToken)

        const { password: _, ...userWithoutPassword } = user
        return res.status(200).json({
            success: true,
            message: 'Sign up successfully',
            data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
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
                .json({ success: false, message: 'User not found.' })
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
        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)

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
                refreshToken,
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

export const signOut = async (req, res) => {
    try {
        // Clear cookies
        clearTokenCookies(res)

        res.status(200).json({
            success: true,
            message: 'Sign out successfully!',
        })
    } catch (error) {
        console.error('Error signing out:', error)
        res.status(500).json({
            success: false,
            message: 'Server error when logging out',
        })
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            omit: {
                password: true,
            },
            where: { id: req.user.id },
            include: {
                badges: true,
                notifications: true,
                tasks: { include: { subtasks: true } },
                daily_task_record: { include: { tasks: true } },
                level: true,
            },
        })

        if (user) {
            return res.status(200).json({ success: true, data: user })
        }

        return res
            .status(500)
            .json({ success: false, message: 'User not found' })
    } catch (error) {
        console.log('Error get me: ', error)
        return res
            .status(500)
            .json({ success: false, message: 'Internal Server Error' })
    }
}

export const refreshToken = async (req, res) => {
    try {
        const userId = req.userId // Từ verifyRefreshToken middleware

        // Check user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User doesn't exists",
            })
        }

        // Generate new tokens
        const accessToken = generateAccessToken(userId)
        const refreshToken = generateRefreshToken(userId)

        // Set new cookies
        setTokenCookies(res, accessToken, refreshToken)

        res.status(200).json({
            success: true,
            message: 'Refresh token successfully',
            data: {
                accessToken,
            },
        })
    } catch (error) {
        console.error('Refresh token error:', error)
        res.status(500).json({
            success: false,
            message: 'Error server when refresh token',
        })
    }
}

export const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body
        const userId = req.user.id // Từ verifyRefreshToken middleware

        // lấy user với password
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        // Verify current password
        const isPasswordValid = await comparePassword(
            current_password,
            user.password
        )

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'The current password is in correct!',
            })
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(new_password)

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        })

        // Clear old tokens
        clearTokenCookies(res)

        res.status(200).json({
            success: true,
            message: 'Change password successfully. Please signin again',
        })
    } catch (error) {
        console.error('Change password error:', error)
        res.status(500).json({
            success: false,
            message: 'Error server when change password',
        })
    }
}
