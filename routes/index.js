import authRouter from './authRouter.js'
// import taskRouter from './taskRouter.js'

export const routes = (app) => {
    // Auth routes
    app.use('/api/v1/auth', authRouter)

    // Task routes
    // app.use('/api/v1/task', taskRouter)

    // Health check
    app.use('/api/v1/health', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'API is running',
            timestamp: new Date().toISOString(),
        })
    })

    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found',
        })
    })
}
