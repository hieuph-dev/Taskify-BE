import express from 'express'
import { signIn, signOut, signUp } from '../controllers/authController.js'
import {
    validate,
    signUpValidator,
    signInValidator,
} from '../validation/userValidation.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/sign-up', validate(signUpValidator), signUp)
router.post('/sign-in', validate(signInValidator), signIn)
router.post('/sign-out', protect, signOut)

export default router
