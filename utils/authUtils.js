import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

// Generate JWT access token (1d)
export const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1d',
    })
}

// Generate JWT refresh token (7d)
export const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    })
}

// Hash password với bcrypt
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

// So sánh password
export const comparePassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword)
}

// Set JWT tokens vào cookies
export const setTokenCookies = (res, accessToken, refreshToken) => {
    // Cookie options
    const accessTokenOptions = {
        httpOnly: true, // Không thể truy cập bằng JavaScript
        secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS ở production
        sameSite: 'strict', // CSRF protection
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 ngày
    }

    const refreshTokenOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    }

    // Set cookies
    res.cookie('token', accessToken, accessTokenOptions)
    res.cookie('refreshToken', refreshToken, refreshTokenOptions)
}

// Clear cookies khi logout
export const clearTokenCookies = (res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    }

    res.clearCookie('token', cookieOptions)
    res.clearCookie('refreshToken', cookieOptions)
}
