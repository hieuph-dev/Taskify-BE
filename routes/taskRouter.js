import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
    createTask,
    getDailyRecordForUser,
    getTaskById,
    getTasksByUserId,
    updateTask,
} from '../controllers/taskController.js'
import {
    createTaskValidator,
    updateTaskValidator,
    validate,
} from '../validation/taskValidation.js'

const router = express.Router()

// -- TASK LIST OPERATIONS --

// Get all tasks của user (có thể filter theo startDate, endDate)
router.get('/', protect, getTasksByUserId)

// Create new task
router.post('/', protect, validate(createTaskValidator), createTask)

// -- DAILY RECORD --

// Get daily task record trong khoảng thời gian (query: from, to)
router.get('/record', protect, getDailyRecordForUser)

// -- SINGLE TASK OPERATIONS --
// Update task
router.put('/:id', protect, validate(updateTaskValidator), updateTask)

// Get task by ID
router.get('/:id', protect, getTaskById)

export default router
