import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
    createTask,
    deleteTask,
    getDailyRecordForUser,
    getTaskById,
    getTasksByUserId,
    markTaskCompleted,
    updateTask,
    updateTaskPriority,
} from '../controllers/taskController.js'
import {
    createTaskValidator,
    updateTaskValidator,
    validate,
} from '../validation/taskValidation.js'

const router = express.Router()

//* -- TASK LIST OPERATIONS --

// Get all tasks của user (có thể filter theo startDate, endDate)
router.get('/', protect, getTasksByUserId)

// Create new task
router.post('/', protect, validate(createTaskValidator), createTask)

//* -- DAILY RECORD --

// Get daily task record trong khoảng thời gian (query: from, to)
router.get('/record', protect, getDailyRecordForUser)

//* -- TASK COMPLETION --

// Mark task là completed
router.post('/completed/:id', protect, markTaskCompleted)

//* -- TASK PRIORITY --
// Update task priority (is_important, is_urgent)
router.put('/priority/:id', protect, updateTaskPriority)

//* -- SINGLE TASK OPERATIONS --

// Get task by ID
router.get('/:id', protect, getTaskById)

// Update task
router.put('/:id', protect, validate(updateTaskValidator), updateTask)

// Delete task
router.delete('/:id', protect, deleteTask)

export default router
