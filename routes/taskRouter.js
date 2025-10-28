import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
    createTask,
    getTaskById,
    getTasksByUserId,
} from '../controllers/taskController.js'
import { createTaskValidator, validate } from '../validation/taskValidation.js'

const router = express.Router()

// -- TASK LIST OPERATIONS --

// Get all tasks của user (có thể filter theo startDate, endDate)
router.get('/', protect, getTasksByUserId)

// Create new task
router.post('/', protect, validate(createTaskValidator), createTask)

// -- DAILY RECORD --

// Get daily task record trong khoảng thời gian (query: from, to)
router.get('/record', protect, getDailyRecordForUser)

// SINGLE TASK OPERATIONS (phải đặt cuối)

// Get task by ID
router.get('/:id', protect, getTaskById)

export default router
