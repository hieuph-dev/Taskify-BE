import express from 'express'
import {
    getMe,
    signIn,
    signOut,
    signUp,
} from '../controllers/authController.js'
import {
    validate,
    signUpValidator,
    signInValidator,
} from '../validation/userValidation.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/sign-up', validate(signUpValidator), signUp)
router.post('/sign-in', validate(signInValidator), signIn)

// Protected routes
router.post('/sign-out', protect, signOut)
router.get('/me', protect, getMe)

export default router
