import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cookieSession from 'cookie-session'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
)

// Security middleware
app.use(helmet())
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100, // limit 100 connections
    })
)

app.use(morgan('dev')) // log the requests
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: process.env.SESSION_SECRET,
    })
)
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
