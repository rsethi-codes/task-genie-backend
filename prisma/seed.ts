import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding questionnaires...');

    const questionnaires = [
        {
            category: 'productivity',
            question: 'What is your main goal for this task?',
            type: 'text',
            aiHint: 'Determines the core purpose',
            isActive: true,
            order: 1
        },
        {
            category: 'productivity',
            question: 'How much focus does this task require?',
            type: 'single_choice',
            options: ['Minimal', 'Light', 'Moderate', 'Deep', 'Intense'],
            aiHint: 'Helps in scheduling',
            isActive: true,
            order: 2
        }
    ];

    for (const q of questionnaires) {
        await prisma.questionnaire.upsert({
            where: { id: '00000000-0000-0000-0000-000000000000' }, // Dummy since we use random UUIDs
            update: {},
            create: q as any
        });
    }

    console.log('✅ Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
