import jwt from 'jsonwebtoken'
import { prisma } from '../config/db.js'

// Middleware để verify JWT token
export const protect = async (req, res, next) => {
    try {
        let token

        // Ưu tiên lấy token từ cookie (vì đã set cookie rồi)
        if (req.cookies.token) {
            token = req.cookies.token
        }
        // Fallback: Lấy từ Authorization header (test postman)
        else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1]
        } else if (req.cookies.token) {
            token = req.cookies.token
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            })
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            // Lấy user từ db không lấy pass
            req.user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    created_at: true,
                    xp: true,
                    streaks: true,
                    last_login: true,
                    levelId: true,
                },
            })

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                })
            }

            next()
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired',
            })
        }
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({
            success: false,
            message: 'Server error in authentication',
        })
    }
}

// Middleware để check refresh token
export const verifyRefreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not found',
            })
        }

        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET
            )
            req.userId = decoded.id
            next()
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
            })
        }
    } catch (error) {
        console.error('Refresh token middleware error: ', error)
        return res.status(500).json({
            success: false,
            message: 'Server error when verify token',
        })
    }
}
