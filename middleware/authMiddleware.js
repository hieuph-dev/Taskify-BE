import jwt from 'jsonwebtoken'
import { prisma } from '../config/db.js'

// Middleware để verify JWT token
export const protect = async (req, res, next) => {
    try {
        let token

        // Lấy token từ Authorization header hoặc cookie
        if (
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
