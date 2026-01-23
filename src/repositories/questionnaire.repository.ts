import { prisma } from "../config/db";
import { Questionnaire, Prisma } from "@prisma/client";

export class QuestionnaireRepository {
    async findMany(filters: any): Promise<Questionnaire[]> {
        return prisma.questionnaire.findMany({
            where: {
                isActive: filters.isActive !== undefined ? filters.isActive : true,
                category: filters.category,
            },
            orderBy: { order: "asc" },
        });
    }

    async create(data: Prisma.QuestionnaireCreateInput): Promise<Questionnaire> {
        return prisma.questionnaire.create({ data });
    }

    async update(id: string, data: Prisma.QuestionnaireUpdateInput): Promise<Questionnaire> {
        return prisma.questionnaire.update({
            where: { id },
            data,
        });
    }

    async findById(id: string): Promise<Questionnaire | null> {
        return prisma.questionnaire.findUnique({
            where: { id },
        });
    }
}

export const questionnaireRepository = new QuestionnaireRepository();
