import { prisma } from '../config/db.js'
import {
    createTaskValidator,
    updateTaskValidator,
} from '../validation/taskValidation.js'

// ============================================
// HELPER FUNCTIONS - XP & LEVEL
// ============================================

// Cộng XP và check level up
async function addXpAndCheckLevel(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { level: true },
    })

    if (!user) throw new Error('User not found')

    const XP_PER_TASK = 10
    let newXp = user.xp + XP_PER_TASK

    // Tìm level hiện tại nếu chưa có
    let currentLevel = user.level
    if (!currentLevel) {
        currentLevel = await prisma.level.findFirst({
            orderBy: { xp_required: 'asc' },
        })
    }

    // Tìm level tiếp theo
    const nextLevel = await prisma.level.findFirst({
        where: { xp_required: { gt: currentLevel.xp_required } },
        orderBy: { xp_required: 'asc' },
    })

    // Check level up
    let newLevelId = user.levelId
    if (nextLevel && newXp >= nextLevel.xp_required) {
        newLevelId = nextLevel.id
    }

    // Update user
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            xp: newXp,
            levelId: newLevelId,
        },
        include: { level: true },
    })

    return updatedUser
}

// Trừ XP và check level down
async function minusXpAndCheckLevel(userId, type) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { level: true },
    })
    if (!user) return null

    const xpToMinus = type === 'overdue' ? 5 : 10
    const newXp = Math.max(0, user.xp - xpToMinus) // Math.max để không cho XP âm → tối thiểu là 0.

    // Tìm level phù hợp với XP mới
    const newLevel = await prisma.level.findFirst({
        where: { xp_required: { lte: newXp } },
        orderBy: { xp_required: 'desc' },
    })

    const currentLevel =
        user.level ||
        (await prisma.level.findFirst({
            orderBy: { xp_required: 'asc' },
        }))

    const newLevelId = newLevel ? newLevel.id : currentLevel.id

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { xp: newXp, levelId: newLevelId },
        include: { level: true },
    })

    return updatedUser
}

// ============================================
// API 1: GET ALL TASKS
// ============================================
export const getTasksByUserId = async (req, res) => {
    const userId = req.user.id // Từ protect middleware
    const { startDate, endDate } = req.query

    try {
        const where = { user_id: userId }

        if (startDate || endDate) {
            where.deadline = {}
            if (startDate) where.deadline.gte = new Date(startDate)
            if (endDate) where.deadline.lte = new Date(endDate)
        }

        const tasks = await prisma.task.findMany({
            where,
            include: { subtasks: true, reminder: true },
            orderBy: [{ deadline: 'asc' }, { created_at: 'asc' }],
        })

        return res.status(200).json({
            success: true,
            data: tasks,
        })
    } catch (error) {
        console.error('Error getting tasks:', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve tasks',
        })
    }
}

// ============================================
// API 2: GET TASK BY ID
// ============================================
export const getTaskById = async (req, res) => {
    const { id } = req.params
    const userId = req.user.id

    try {
        const task = await prisma.task.findFirst({
            where: {
                id,
                user_id: userId, // Check ownership
            },
            include: { subtasks: true, reminder: true },
        })

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            })
        }

        return res.status(200).json({
            success: true,
            data: task,
        })
    } catch (error) {
        console.error('Error getting task:', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve task',
        })
    }
}

// ============================================
// API 3: DELETE TASK
// ============================================
export const deleteTask = async (req, res) => {
    const { id } = req.params
    const userId = req.user.id

    try {
        // Check task exists and ownership
        const task = await prisma.task.findFirst({
            where: { id, user_id: userId },
        })

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            })
        }

        // Delete (cascade sẽ xóa subtasks tự động)
        await prisma.task.delete({ where: { id } })

        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting task:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
}

// ============================================
// API 4: UPDATE TASK PRIORITY
// ============================================
export const updateTaskPriority = async (req, res) => {
    const { id } = req.params
    const { is_important, is_urgent } = req.body
    const userId = req.user.id

    try {
        // Validate input
        if (is_important === undefined && is_urgent === undefined) {
            return res.status(400).json({
                success: false,
                message:
                    'At least one of is_important or is_urgent must be provided',
            })
        }

        // Check task exists and ownership
        const task = await prisma.task.findFirst({
            where: { id, user_id: userId },
        })

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            })
        }

        // Update
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                is_important: is_important ?? task.is_important,
                is_urgent: is_urgent ?? task.is_urgent,
            },
        })

        return res.status(200).json({
            success: true,
            data: updatedTask,
        })
    } catch (error) {
        console.error('Error updating task priority:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
}

// ============================================
// API 5: CREATE TASK
// ============================================
export const createTask = async (req, res) => {
    const {
        name,
        note,
        category,
        is_important,
        is_urgent,
        deadline,
        subtasks,
    } = req.body

    const userId = req.user.id // Từ protect middleware

    try {
        // Validate body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No data provided',
            })
        }

        await createTaskValidator.validateAsync(req.body)

        // Parse deadline
        const parsedDeadline = new Date(deadline)
        const now = new Date()

        // Check OVERDUE
        const isTaskOverdue = parsedDeadline <= now
        const taskStatus = isTaskOverdue ? 'OVERDUE' : 'NOT_DONE'

        // Create task
        const newTask = await prisma.task.create({
            data: {
                user_id: userId,
                name,
                note,
                category,
                is_important: is_important ?? false, // Chỉ null và undefined mới bị thay bằng giá trị mặc định.
                is_urgent: is_urgent ?? false,
                deadline: parsedDeadline,
                status: taskStatus,
            },
            include: { subtasks: true },
        })

        // Create subtasks nếu có
        if (subtasks && subtasks.length > 0) {
            await prisma.subtask.createMany({
                data: subtasks.map((st) => ({
                    task_id: newTask.id,
                    name: st.name,
                    is_completed: st.is_completed ?? false,
                })),
            })
        }

        // Trừ XP nếu task tạo ra đã OVERDUE
        if (isTaskOverdue) {
            await minusXpAndCheckLevel(userId, 'overdue')
        }

        // Lấy lại cả task lẫn subtasks
        const taskWithSubtasks = await prisma.task.findUnique({
            where: { id: newTask.id },
            include: { subtasks: true },
        })

        return res.status(201).json({
            success: true,
            data: taskWithSubtasks, // trả về cả task lẫn sub task
        })
    } catch (error) {
        console.error('Error creating task:', error)

        if (error.isJoi) {
            return res.status(400).json({
                success: false,
                message: error.details.map((err) => err.message),
            })
        }

        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
}

// ============================================
// API 6: UPDATE TASK
// ============================================
export const updateTask = async (req, res) => {
    const { id } = req.params
    const {
        name,
        note,
        category,
        is_important,
        is_urgent,
        deadline,
        subtasks,
    } = req.body
    const userId = req.user.id

    try {
        // Validate body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No data provided',
            })
        }

        await updateTaskValidator.validateAsync(req.body)

        // Check task exists and ownership
        const oldTask = await prisma.task.findFirst({
            where: { id, user_id: userId },
            include: { subtasks: true },
        })

        if (!oldTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            })
        }

        // Parse deadline nếu có
        let parsedDeadline = oldTask.deadline
        if (deadline) {
            parsedDeadline = new Date(deadline)
        }

        // Update task
        let updatedTask = await prisma.task.update({
            where: { id },
            data: {
                name: name ?? oldTask.name, // ?? để giữ giá trị cũ nếu không có thay đổi.
                note: note ?? oldTask.note,
                category: category ?? oldTask.category,
                is_important: is_important ?? oldTask.is_important,
                is_urgent: is_urgent ?? oldTask.is_urgent,
                deadline: deadline ?? oldTask.deadline,

                // Upsert subtasks
                subtasks: subtasks
                    ? {
                          // Upsert = Update + Insert
                          //    → Nếu subtask có ID → sửa
                          //    → Nếu subtask không có ID → tạo mới
                          upsert: subtasks.map((st) => ({
                              where: { id: st.id || '' },
                              update: {
                                  name: st.name,
                                  is_completed: st.is_completed,
                              },
                              create: {
                                  name: st.name,
                                  is_completed: st.is_completed ?? false,
                              },
                          })),
                      }
                    : undefined,
            },
            include: { subtasks: true },
        })

        // Check OVERDUE nếu update deadline
        if (deadline && oldTask.status !== 'COMPLETED') {
            const now = new Date()
            const isOverdue = parsedDeadline <= now

            if (isOverdue) {
                updatedTask = await prisma.task.update({
                    where: { id },
                    data: { status: 'OVERDUE' },
                    include: { subtasks: true },
                })

                // Chỉ trừ XP nếu task chuyển từ NOT_DONE -> OVERDUE
                if (oldTask.status === 'NOT_DONE') {
                    await minusXpAndCheckLevel(userId, 'overdue')
                }
            } else {
                updatedTask = await prisma.task.update({
                    where: { id },
                    data: { status: 'NOT_DONE' },
                    include: { subtasks: true },
                })
            }
        }

        return res.status(200).json({
            success: true,
            data: updatedTask,
        })
    } catch (error) {
        console.error('Error updating task:', error)

        if (error.isJoi) {
            return res.status(400).json({
                success: false,
                message: error.details.map((err) => err.message),
            })
        }

        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
}

// ============================================
// API 7: MARK TASK COMPLETED
// ============================================
export const markTaskCompleted = async (req, res) => {
    const userId = req.user.id
    const { id } = req.params

    try {
        // Check task exists and ownership
        const task = await prisma.task.findFirst({
            where: { id, user_id: userId },
        })

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            })
        }

        // Không cho complete task đã completed
        if (task.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Task is already completed',
            })
        }

        const now = new Date()
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)

        // Tạo hoặc lấy dailyTaskRecord
        await prisma.dailyTaskRecord.upsert({
            where: {
                user_id_date: { user_id: userId, date: today },
            },
            update: {},
            create: {
                user_id: userId,
                date: today,
            },
        })

        // Update task status
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completed_at: now,
                dailyTaskRecordUser_id: userId,
                dailyTaskRecordDate: today,
            },
        })
        // Cộng XP và check level
        const updatedUser = await addXpAndCheckLevel(userId)

        return res.status(200).json({
            success: true,
            data: {
                task: updatedTask,
                user: updatedUser,
            },
        })
    } catch (error) {
        console.error('Error marking task completed:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
}

// ============================================
// API 9: GET DAILY RECORD
// ============================================
export const getDailyRecordForUser = async (req, res) => {
    const userId = req.user.id
    const { from, to } = req.query

    try {
        // Validate query params
        if (!from || !to) {
            return res.status(400).json({
                success: false,
                message: 'Missing from/to parameters',
            })
        }

        const fromDate = new Date(from)
        const toDate = new Date(to)

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format',
            })
        }

        // Get records
        const records = await prisma.dailyTaskRecord.findMany({
            where: {
                user_id: userId,
                date: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            include: {
                tasks: {
                    include: { subtasks: true },
                },
            },
            orderBy: { date: 'asc' },
        })

        return res.status(200).json({
            success: true,
            data: records,
        })
    } catch (error) {
        console.error('Error getting daily records:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
}
