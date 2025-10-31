import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const levels = [
        { name: 'Newbie', xp_required: 0 },
        { name: 'Beginner', xp_required: 100 },
        { name: 'Intermediate', xp_required: 500 },
        { name: 'Advanced', xp_required: 1000 },
        { name: 'Expert', xp_required: 2000 },
        { name: 'Master', xp_required: 5000 },
    ]

    // Check nếu đã có level thì không tạo nữa
    const existingLevels = await prisma.level.count()

    if (existingLevels === 0) {
        await prisma.level.createMany({
            data: levels,
            skipDuplicates: true,
        })
        console.log('✅ Seeded levels successfully')
    } else {
        console.log('ℹ️  Levels already exist, skipping seed')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
