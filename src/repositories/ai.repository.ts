import { prisma } from "../config/db";
import { QuestionSession, QuestionResponse, Prisma } from "@prisma/client";

export class AIRepository {
    async createSession(data: Prisma.QuestionSessionUncheckedCreateInput): Promise<QuestionSession> {
        return prisma.questionSession.create({ data });
    }

    async getSession(id: string): Promise<QuestionSession | null> {
        return prisma.questionSession.findUnique({
            where: { id },
            include: {
                responses: {
                    orderBy: { order: 'asc' }
                }
            }
        });
    }

    async updateSession(id: string, data: Prisma.QuestionSessionUncheckedUpdateInput): Promise<QuestionSession> {
        return prisma.questionSession.update({
            where: { id },
            data,
        });
    }

    async createResponse(data: Prisma.QuestionResponseUncheckedCreateInput): Promise<QuestionResponse> {
        return prisma.$transaction(async (tx) => {
            const resp = await tx.questionResponse.create({ data });

            // Update session stats
            await tx.questionSession.update({
                where: { id: data.sessionId },
                data: {
                    answeredQuestions: { increment: 1 },
                    totalQuestions: { increment: 1 },
                }
            });

            return resp;
        });
    }
}

export const aiRepository = new AIRepository();
