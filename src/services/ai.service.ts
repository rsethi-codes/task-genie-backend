import { aiRepository } from "../repositories/ai.repository";
import { taskRepository } from "../repositories/task.repository";
import { auditLogRepository } from "../repositories/audit-log.repository";
import { subtaskRepository } from "../repositories/subtask.repository";
import { intelligenceService } from "./intelligence.service";

export class AIService {
    async startSession(userId: string, taskId: string | null, data: any) {
        if (taskId) {
            const task = await taskRepository.findById(taskId, userId);
            if (!task) throw new Error("Task not found or unauthorized");
        }

        const session = await aiRepository.createSession({
            userId,
            taskId,
            ...data,
        });

        await auditLogRepository.create({
            entityType: "ai_session",
            entityId: session.id,
            action: "started",
            performedBy: userId,
            meta: { taskId } as any
        });

        return session;
    }

    async addMessage(userId: string, sessionId: string, data: any) {
        const session = await aiRepository.getSession(sessionId);
        if (!session || session.userId !== userId) throw new Error("Session not found or unauthorized");
        if (session.status !== "open") throw new Error("Session is not open");

        const response = await aiRepository.createResponse({
            sessionId,
            userId,
            ...data,
            answeredAt: new Date(),
            order: session.answeredQuestions + 1,
            answer: data.answer as any
        });

        return response;
    }

    async completeSession(userId: string, sessionId: string, data: any) {
        const session = await aiRepository.getSession(sessionId);
        if (!session || session.userId !== userId) throw new Error("Session not found or unauthorized");

        const updatedSession = await aiRepository.updateSession(sessionId, {
            status: "completed",
            completedAt: new Date(),
            decision: data.decision as any,
            decisionConfidence: data.decisionConfidence,
        });

        // If there's a task associated, update it with AI metadata
        if (session.taskId) {
            await taskRepository.update(session.taskId, userId, {
                aiMetadata: data.decision as any,
            });

            // Create subtasks if provided
            if (data.subtasks && Array.isArray(data.subtasks)) {
                for (const sub of data.subtasks) {
                    await subtaskRepository.create({
                        ...sub,
                        parentTaskId: session.taskId,
                        userId,
                        aiGenerated: true,
                    });
                }
            }
        }

        // Check if decision contains persona traits (e.g. from Onboarding)
        const decisionAny = data.decision as any;
        if (decisionAny?.userTraits || decisionAny?.computedPersona) {
            const traits = decisionAny.userTraits || decisionAny.computedPersona;
            console.log(`[AI Service] Found persona traits in session ${sessionId}, updating user persona...`);
            await intelligenceService.updatePersona(userId, traits, 'onboarding_completion');
        }

        await auditLogRepository.create({
            entityType: "ai_session",
            entityId: sessionId,
            action: "completed",
            performedBy: userId,
            meta: { taskId: session.taskId } as any
        });

        return updatedSession;
    }

    async getSession(userId: string, sessionId: string) {
        const session = await aiRepository.getSession(sessionId);
        if (!session || session.userId !== userId) throw new Error("Session not found or unauthorized");
        return session;
    }
}

export const aiService = new AIService();
