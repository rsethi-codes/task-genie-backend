import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding questionnaires...');

    const questionnaires = [
        // -----------------------------------------------------------------
        // Onboarding (category: onboarding)
        // -----------------------------------------------------------------
        {
            category: 'onboarding',
            question: 'When do you feel most productive?',
            type: 'single_choice',
            options: ['Morning', 'Afternoon', 'Evening', 'Night', 'It varies'],
            aiHint: 'Helps infer preferred work windows and time-of-day energy patterns',
            aiImportance: 0.9,
            isActive: true,
            order: 1
        },
        {
            category: 'onboarding',
            question: 'When you plan tasks, what do you want to default to?',
            type: 'single_choice',
            options: ['Medium', 'High', 'Low', 'Urgent only when needed'],
            aiHint: 'Maps to UserProfile.defaultPriority',
            aiImportance: 0.8,
            isActive: true,
            order: 2
        },
        {
            category: 'onboarding',
            question: 'Do you have fixed working hours?',
            type: 'single_choice',
            options: ['Yes', 'No', 'Somewhat'],
            aiHint: 'Used to decide whether to ask for work start/end time',
            aiImportance: 0.7,
            isActive: true,
            order: 3
        },
        {
            category: 'onboarding',
            question: 'What time do you usually start? (HH:MM)',
            type: 'time',
            options: [],
            aiHint: 'Maps to UserProfile.workStartTime',
            aiImportance: 0.65,
            conditionalOn: null,
            conditionalValue: null,
            isActive: true,
            order: 4
        },
        {
            category: 'onboarding',
            question: 'What time do you usually stop? (HH:MM)',
            type: 'time',
            options: [],
            aiHint: 'Maps to UserProfile.workEndTime',
            aiImportance: 0.65,
            conditionalOn: null,
            conditionalValue: null,
            isActive: true,
            order: 5
        },
        {
            category: 'onboarding',
            question: 'What’s a good default break length for you?',
            type: 'single_choice',
            options: ['5 min', '10 min', '15 min', '25 min', 'It depends'],
            aiHint: 'Maps to UserProfile.breakDuration when numeric',
            aiImportance: 0.55,
            isActive: true,
            order: 6
        },
        {
            category: 'onboarding',
            question: 'For a typical task, what default duration should we assume?',
            type: 'single_choice',
            options: ['15 min', '30 min', '45 min', '60 min', 'It varies'],
            aiHint: 'Maps to UserProfile.defaultDuration when numeric',
            aiImportance: 0.7,
            isActive: true,
            order: 7
        },

        // -----------------------------------------------------------------
        // Productivity (existing)
        // -----------------------------------------------------------------
        {
            category: 'productivity',
            question: 'What is your main goal for this task?',
            type: 'text',
            aiHint: 'Determines the core purpose',
            aiImportance: 0.6,
            isActive: true,
            order: 1
        },
        {
            category: 'productivity',
            question: 'How much focus does this task require?',
            type: 'single_choice',
            options: ['Minimal', 'Light', 'Moderate', 'Deep', 'Intense'],
            aiHint: 'Helps in scheduling',
            aiImportance: 0.6,
            isActive: true,
            order: 2
        }
    ];

    for (const q of questionnaires) {
        const existing = await prisma.questionnaire.findFirst({
            where: {
                category: q.category,
                question: q.question,
                order: q.order,
            },
        });

        if (existing) {
            await prisma.questionnaire.update({
                where: { id: existing.id },
                data: {
                    ...q,
                    // Ensure options always exists for prisma schema
                    options: (q as any).options || [],
                } as any,
            });
        } else {
            await prisma.questionnaire.create({
                data: {
                    ...q,
                    options: (q as any).options || [],
                } as any,
            });
        }
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
