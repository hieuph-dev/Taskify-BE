import express from 'express'
import { signIn, signUp } from '../controllers/authController.js'
import {
    validate,
    signUpValidator,
    signInValidator,
} from '../validation/userValidation.js'

const router = express.Router()

router.post('/sign-up', validate(signUpValidator), signUp)
router.post('/sign-in', validate(signInValidator), signIn)

export default router
