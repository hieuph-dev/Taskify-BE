import express from 'express'
import {
    changePassword,
    getMe,
    refreshToken,
    signIn,
    signOut,
    signUp,
} from '../controllers/authController.js'
import {
    validate,
    signUpValidator,
    signInValidator,
    changePasswordValidator,
} from '../validation/userValidation.js'
import { protect, verifyRefreshToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/sign-up', validate(signUpValidator), signUp)
router.post('/sign-in', validate(signInValidator), signIn)
router.post('/refresh-token', verifyRefreshToken, refreshToken)

// Protected routes
router.post('/sign-out', protect, signOut)
router.get('/me', protect, getMe)
router.put(
    '/change-password',
    protect,
    validate(changePasswordValidator),
    changePassword
)

export default router
