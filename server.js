import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cookieSession from 'cookie-session'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { routes } from './routes/index.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

// Body parser middleware
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS configuration
app.use(
    cors({
        origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
        credentials: true,
    })
)

// Security middleware
app.use(helmet())

// Rate limiting
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    })
)

// Logging middleware
app.use(morgan('dev')) // log the requests

// Cookie session
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: [process.env.SESSION_SECRET || 'ancks'],
    })
)

// Error handling middleware
app.use((err, req, res, next) => {
    console.log('Global error:', err.stack)

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
})

// Init routes
routes(app)

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
