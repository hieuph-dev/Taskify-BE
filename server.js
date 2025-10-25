import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cookieSession from 'cookie-session'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

app.use(cookieParser())
app.use(express.json())
app.use(
    cors({
        origin: ['http://localhost:5173'],
        credentials: true,
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
