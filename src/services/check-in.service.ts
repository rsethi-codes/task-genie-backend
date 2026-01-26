
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/db";
import { QuestionSession, SessionStatus, QuestionType } from "@prisma/client";
import { getAIProvider } from "../ai/get-ai-provider";
import { CHECK_IN_SYSTEM_PROMPT, constructCheckInUserPrompt } from "../ai/prompts/check-in.prompt";
import { taskRepository } from "../repositories/task.repository";
import { TaskNode } from "@prisma/client";

export type CheckInInput = {
    energy: number; // 1-5
    moods: string[];
    reflection?: string;
};

export type CheckInResponse = {
    sessionId: string;
    status: SessionStatus;
    aiState: "thinking" | "asking" | "concluded";
    question?: {
        text: string;
        options?: string[];
    };
    recommendation?: {
        strategy: string;
        rationale: string;
        primaryAction: {
            text: string;
            nodeId?: string;
        };
        alternatives: Array<{
            text: string;
            nodeId?: string;
        }>;
    };
};

export class CheckInService {

    /**
     * Starts a new check-in session or retrieves an active one?
     * For simplicity, check-ins are usually fresh.
     */
    async startSession(userId: string): Promise<string> {
        const session = await prisma.questionSession.create({
            data: {
                userId,
                status: SessionStatus.open,
                initialPersona: false, // It's a check-in, not onboarding
                // We can use modelConfigId or a meta field later to tag this as check-in if needed
                // For now, we rely on the flow logic.
            },
        });
        return session.id;
    }

    async processInput(userId: string, sessionId: string, input: CheckInInput): Promise<CheckInResponse> {
        // 1. Save the inputs as 'responses' in the DB so we have a record
        // We'll treat Energy, Mood, Reflection as QuestionResponses.

        // Check if session exists
        const session = await prisma.questionSession.findFirst({
            where: { id: sessionId, userId }
        });

        if (!session) throw new Error("Session not found");

        // Save Responses (Pseudo-questions for metrics)
        await prisma.questionResponse.createMany({
            data: [
                {
                    sessionId,
                    userId,
                    questionText: "Energy Level",
                    questionType: QuestionType.scale,
                    answer: { value: input.energy },
                    answeredAt: new Date(),
                    order: 1,
                    responseTime: 0 // Client should track this really
                },
                {
                    sessionId,
                    userId,
                    questionText: "Mood",
                    questionType: QuestionType.multiple_choice,
                    answer: { values: input.moods },
                    answeredAt: new Date(),
                    order: 2,
                    responseTime: 0
                },
                {
                    sessionId,
                    userId,
                    questionText: "Reflection",
                    questionType: QuestionType.text,
                    answer: { text: input.reflection || "" },
                    answeredAt: new Date(),
                    order: 3,
                    responseTime: 0
                }
            ]
        });

        // 2. Fetch User Context & Tasks (Defensive)
        let cleanTasks: any[] = [];
        let userDisplayName = "User";

        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            userDisplayName = user?.displayName || "User";

            // Defensive task fetch - wrap in try/catch to ensure we proceed even if DB/Schema is weird
            const tasks = await taskRepository.findMany(userId, {
                status: "ACTIVE",
                limit: 15
            });

            cleanTasks = tasks.map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                estimatedDuration: t.estimatedDuration || 15
            }));
        } catch (dbError) {
            console.error("CheckInService: Partial failure fetching context", dbError);
            // We continue with empty tasks to at least give a generic recommendation
        }

        // 3. Call AI (Defensive)
        let decision: any = null;
        try {
            const provider = getAIProvider(); // No arg needed usually, defaults handled
            const aiResponse = await provider.conductCheckIn({
                userName: userDisplayName,
                energy: input.energy,
                moods: input.moods,
                reflection: input.reflection || null,
                tasks: cleanTasks,
                timeOfDay: new Date().toLocaleTimeString()
            }, {
                feature: "CheckIn",
                userId
            });

            const result = aiResponse.data;

            // If AI asks specific follow up, we currently skip multi-turn in V1 fallback to keep UI unblocked
            if (result.requiresFollowUp && result.followUpQuestion) {
                // For now, treat follow-up request as a reason to just pick detailed thinking or fallback?
                // Let's degrade to a generic response if multi-turn isn't supported by UI
                // OR return it but UI needs to handle it.
                // Requirement: "process must always return a decision result"
                // So we force a decision structure even if partial.
            }

            decision = result.decision;
        } catch (aiError) {
            console.error("CheckInService: AI Generation failed", aiError);
            // Fallback decision logic inside catch
        }

        // 4. Fallback Logic (Guaranteed Result)
        if (!decision) {
            // Static fallback based on energy
            if (input.energy <= 2) {
                decision = {
                    strategy: "rest",
                    rationale: "I couldn't fully analyze the details, but your energy seems low. It's okay to take a break.",
                    suggestedAction: "Take 15 minutes to unplug.",
                    suggestedNodeId: null,
                    alternatives: []
                };
            } else {
                decision = {
                    strategy: "easy_win",
                    rationale: "I'm having trouble connecting to the full plan, but let's keep it simple.",
                    suggestedAction: "Pick one small task and just start.",
                    suggestedNodeId: cleanTasks[0]?.id || null,
                    alternatives: []
                };
            }
        }

        // Ensure robust structure
        if (!decision.alternatives) decision.alternatives = [];

        // Close phase
        try {
            await prisma.questionSession.update({
                where: { id: sessionId },
                data: {
                    status: SessionStatus.completed,
                    completedAt: new Date(),
                    decision: decision
                }
            });
        } catch (e) {
            console.error("CheckInService: Failed to close session record", e);
        }

        return {
            sessionId,
            status: SessionStatus.completed,
            aiState: "concluded",
            recommendation: {
                strategy: decision.strategy || "easy_win",
                rationale: decision.rationale || "Let's move forward one step at a time.",
                primaryAction: {
                    text: decision.suggestedAction || "Check your list",
                    nodeId: decision.suggestedNodeId
                },
                alternatives: (decision.alternatives || []).map((alt: any) => ({
                    text: alt.action || alt.label || "Alternative option",
                    nodeId: alt.nodeId
                }))
            }
        };
    }

    // Handle follow-up answer
    async processFollowUp(userId: string, sessionId: string, answerText: string): Promise<CheckInResponse> {
        // Load previous context + new answer -> Call AI again.
        // This requires storing the previous context.
        // Since QuestionSession has 'responses', we can look those up.

        // Fetch session and all responses
        const session = await prisma.questionSession.findFirst({
            where: { id: sessionId, userId },
            include: { responses: { orderBy: { order: 'asc' } } }
        });

        if (!session) throw new Error("Session not found");

        // Save this new answer
        await prisma.questionResponse.create({
            data: {
                sessionId,
                userId,
                questionText: "Follow-up",
                questionType: QuestionType.text,
                answer: { text: answerText },
                answeredAt: new Date(),
                order: session.responses.length + 1,
                responseTime: 0
            }
        });

        // Re-construct prompt with full history
        // Need to re-fetch tasks etc. 
        // This is getting slightly expensive but okay for a low-frequency action.

        // ... (This logic is similar to processInput regarding DB fetch)
        // Ideally I'd refactor the context building.

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const tasks = await taskRepository.findMany(userId, { status: "ACTIVE", limit: 15 });
        const cleanTasks = tasks.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, estimatedDuration: t.estimatedDuration }));

        // Reconstruct history text
        const historyText = session.responses.map(r => {
            let ans: string = "";
            if (typeof r.answer === 'object' && r.answer && 'text' in (r.answer as any)) ans = (r.answer as any).text;
            else if (typeof r.answer === 'object' && r.answer && 'values' in (r.answer as any)) ans = (r.answer as any).values.join(", ");
            else if (typeof r.answer === 'object' && r.answer && 'value' in (r.answer as any)) ans = String((r.answer as any).value);

            return `${r.questionText}: ${ans}`;
        }).join("\n");

        // Add the new answer
        const fullHistory = `${historyText}\nFollow-up Answer: ${answerText}`;

        const provider = getAIProvider();
        const aiResponse = await provider.conductCheckIn({
            userName: user?.displayName || "User",
            energy: 3, // Default or need to store in session? For now assume mid if not persisted
            moods: [],
            reflection: null,
            tasks: cleanTasks,
            timeOfDay: new Date().toLocaleTimeString(),
            history: fullHistory
        }, {
            feature: "CheckIn",
            userId
        });
        const result = aiResponse.data;

        if (result.requiresFollowUp && result.followUpQuestion) {
            return {
                sessionId,
                status: SessionStatus.open,
                aiState: "asking",
                question: {
                    text: result.followUpQuestion
                }
            };
        }

        const decision = result.decision;
        await prisma.questionSession.update({
            where: { id: sessionId },
            data: {
                status: SessionStatus.completed,
                completedAt: new Date(),
                decision: decision
            }
        });

        return {
            sessionId,
            status: SessionStatus.completed,
            aiState: "concluded",
            recommendation: {
                strategy: decision.strategy,
                rationale: decision.rationale,
                primaryAction: {
                    text: decision.suggestedAction,
                    nodeId: decision.suggestedNodeId
                },
                alternatives: (decision.alternatives || []).map((alt: any) => ({
                    text: alt.action,
                    nodeId: alt.nodeId
                }))
            }
        };
    }
}

export const checkInService = new CheckInService();
