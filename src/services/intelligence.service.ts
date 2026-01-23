
import { geminiModel } from "../config/gemini";
import { userRepository } from "../repositories/user.repository";
import { taskRepository } from "../repositories/task.repository";
import { subtaskRepository } from "../repositories/subtask.repository";
import { prisma } from "../config/db";
import { Task, User, BehaviorPattern } from "@prisma/client";

export class IntelligenceService {

    /**
     * Generates subtasks for a task based on user persona and task context.
     */
    async generateSubtasks(userId: string, taskId: string): Promise<any[]> {
        const user = await userRepository.findWithPersona(userId);
        if (!user) throw new Error("User not found");

        const task = await taskRepository.findById(taskId, userId);
        if (!task) throw new Error("Task not found");

        const prompt = this.buildPrompt(user, task);

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Robust JSON extraction
            let jsonStr = text;
            const jsonMatch = text.match(/\[[\s\S]*\]/); // Find the first array
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            } else {
                jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
            }

            const subtasks = JSON.parse(jsonStr);
            if (!Array.isArray(subtasks)) throw new Error("AI did not return an array");

            // Guardrail: Max subtask depth = 2 layers (enforced by schema not allowing subtasks of subtasks)
            // Guardrail: Limit subtask count as per PRD (3-7 subtasks suggested)
            const limitedSubtasks = subtasks.slice(0, 7);

            // Save subtasks
            const createdSubtasks = [];
            for (let i = 0; i < limitedSubtasks.length; i++) {
                const s = limitedSubtasks[i];
                createdSubtasks.push(await subtaskRepository.create({
                    parentTaskId: taskId,
                    userId,
                    title: s.title,
                    description: s.description,
                    estimatedDuration: s.estimatedDuration,
                    energyRequired: s.energyRequired || 'medium', // Fail-safe
                    status: 'pending',
                    order: i,
                    aiGenerated: true,
                    aiConfidence: 0.85,
                    promptHash: Buffer.from(prompt).toString('base64').substring(0, 32) // Simple hash
                } as any));
            }

            // Create Refinement Session for learning
            // We use a transaction or just fire and forget for now, but ideally strict.
            await prisma.refinementSession.create({
                data: {
                    userId,
                    taskId,
                    originalPlan: subtasks,
                    status: "active"
                }
            });

            return createdSubtasks;

        } catch (error) {
            console.error("Gemini Error:", error);
            throw new Error("Failed to generate subtasks");
        }
    }

    /**
     * Enriches a task intent string into a full task object.
     */
    async enrichTaskIntent(userId: string, title: string): Promise<any> {
        const user = await userRepository.findWithPersona(userId);
        if (!user) throw new Error("User not found");

        const prompt = this.buildEnrichmentPrompt(user, title);

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
            const enrichment = JSON.parse(jsonStr);

            return enrichment;
        } catch (error) {
            console.error("Enrichment Error:", error);
            throw new Error("Failed to enrich task intent");
        }
    }

    private buildEnrichmentPrompt(user: any, title: string): string {
        let personaContext = "The user is a general user.";
        const userAny = user as any;
        if (userAny.personaSnapshots && userAny.personaSnapshots.length > 0) {
            const snap = userAny.personaSnapshots[0];
            personaContext = `User Traits: ${JSON.stringify(snap.traits)}.`;
        }

        return `
        You are TaskGenie, an intelligent task planner.
        
        GOAL: Complete the task details based on the user's short intent.
        
        USER PERSONA:
        ${personaContext}
        
        INTENT:
        "${title}"
        
        INSTRUCTIONS:
        1. Predict the following fields:
           - description: A more detailed explanation or breakdown of the goal.
           - priority: HIGH, MEDIUM, or LOW.
           - category: A single word or short phrase (e.g., Work, Personal, Health, Finance).
           - dueDate: An ISO 8601 date string if a time is mentioned or implied, otherwise null.
           - reasoning: A short 1-sentence explanation of why these values were chosen.
        
        2. Make the description actionable and aligned with the user's persona.
        
        OUTPUT FORMAT (JSON ONLY):
        {
            "description": "...",
            "priority": "...",
            "category": "...",
            "dueDate": "...",
            "reasoning": "..."
        }
        `;
    }

    private buildPrompt(user: any, task: Task): string {
        let personaContext = "The user is a general user.";

        // Extract Persona Insights
        const userAny = user as any;
        if (userAny.personaSnapshots && userAny.personaSnapshots.length > 0) {
            const snap = userAny.personaSnapshots[0];
            personaContext = `User Traits: ${JSON.stringify(snap.traits)}.`;
        }

        // Behavior Patterns
        if (userAny.behaviorPatterns && userAny.behaviorPatterns.length > 0) {
            const patterns = userAny.behaviorPatterns.map((p: BehaviorPattern) =>
                `${p.patternType} (Confidence: ${p.confidence})`
            ).join(", ");
            personaContext += ` Observed Patterns: ${patterns}.`;
        }

        // Task Context
        const taskContext = `
        Task Title: ${task.title}
        Description: ${task.description || "No description"}
        Priority: ${task.priority}
        Category: ${task.category || "General"}
        Due: ${task.dueDate || "No due date"}
        `;

        // Profile Preferences (e.g. Work hours)
        let preferencesContext = "";
        const profile = userAny.profile;
        if (profile) {
            preferencesContext = `
            Work Hours: ${profile.workStartTime || "09:00"} - ${profile.workEndTime || "17:00"}
            Preferred Block Duration: ${profile.defaultDuration || 30} mins
            Break Frequency: Every ${profile.breakDuration || 60} mins
            `;
        }

        return `
        You are TaskGenie, an intelligent task planner.
        
        GOAL: Break down the following task into subtasks.
        
        USER PERSONA:
        ${personaContext}
        
        TASK:
        ${taskContext}

        PREFERENCES:
        ${preferencesContext}
        
        INSTRUCTIONS:
        1. Adapt the breakdown to the user's persona AND past behavior.
           - If Detail-Oriented: Use granular steps.
           - If Big-Picture: Use high-level milestones.
           - If Low-Energy (based on persona or current time if known): Keep steps simple and actionable.
           - If High-Energy/Focus: Batch small tasks or suggest deep work blocks.
        2. Assign realistic estimated durations (minutes).
        3. Assign energy requirement (low, medium, high).
        4. Consider the user's work hours and preferred block duration if relevant.
        
        OUTPUT FORMAT:
        Return ONLY a raw JSON array. No markdown formatting around it if possible, or just standard markdown code block.
        [
            {
                "title": "Subtask title",
                "description": "Optional details",
                "estimatedDuration": 15,
                "energyRequired": "low"
            }
        ]
        `;
    }

    /**
     * Captures user edits to subtasks as a learning signal.
     */
    async captureRefinementSignal(userId: string, taskId: string, finalSubtasks: any[]) {
        const session = await prisma.refinementSession.findUnique({
            where: { taskId }
        });

        if (session) {
            // Compare originalPlan vs finalSubtasks
            // This logic can be complex (diffing), for now we just store the final plan
            await prisma.refinementSession.update({
                where: { id: session.id },
                data: {
                    finalPlan: finalSubtasks,
                    status: "finalized",
                    updatedAt: new Date()
                }
            });

            // Trigger async learning analysis
            this.analyzeRefinement(userId, taskId, session.originalPlan, finalSubtasks).catch(err => {
                console.error("[Learning] analysis failed", err);
            });
        }
    }

    /**
     * Analyzes the difference between AI plan and User plan to generates BehaviorPatterns.
     */
    async analyzeRefinement(userId: string, taskId: string, original: any, final: any) {
        // 1. Build Analysis Prompt
        const prompt = `
        You are a Pattern Analyst AI.
        
        TASK: Compare the Original AI Plan vs. the User's Final Plan.
        Identify ONE behavior pattern that explains the changes.
        
        ORIGINAL:
        ${JSON.stringify(original)}
        
        FINAL (USER EDITED):
        ${JSON.stringify(final)}
        
        OUTPUT FORMAT (JSON ONLY):
        {
            "patternType": "detail_oriented" | "big_picture" | "low_interruption_tolerance" | "high_autonomy",
            "confidence": 0.1 to 1.0,
            "observation": "User deleted granular steps and kept only milestones."
        }
        `;

        try {
            const result = await geminiModel.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
            const analysis = JSON.parse(jsonStr);

            if (analysis && analysis.patternType) {
                await (prisma as any).behaviorPattern.create({
                    data: {
                        userId,
                        patternType: analysis.patternType,
                        confidence: analysis.confidence,
                        source: `refinement_task_${taskId}`,
                        detectedAt: new Date(),
                        meta: { observation: analysis.observation }
                    }
                });
                console.log(`[Learning] Learned pattern: ${analysis.patternType}`);
            }

        } catch (error) {
            console.error("Pattern analysis failed:", error);
        }
    }

    /**
     * Determines if a notification should be sent based on persona and context.
     */
    async shouldNotify(userId: string, context: { type: 'start' | 'resume' | 'completion', importance: number }): Promise<boolean> {
        const user = await userRepository.findWithPersona(userId);
        if (!user) return false;

        // 1. Check basic profile preferences (if any)
        // const prefs = user.profile?.customPreferences as any;
        // if (prefs?.notificationsEnabled === false) return false;

        // 2. Check Persona Tolerance
        let tolerance = 0.5; // Default medium
        const userAny = user as any;
        if (userAny.behaviorPatterns) {
            // Pseudo-logic: Find pattern related to "notification_tolerance" or infer from energy
            // For now, checks if we have a pattern "low_interruption_tolerance"
            const intolerant = userAny.behaviorPatterns.some((p: any) => p.patternType === 'low_interruption_tolerance');
            if (intolerant) tolerance = 0.2;
        }

        // 3. Check Recent Abandonment (Don't annoy if they are ignoring)
        // This requires querying Reminder logs or AuditLogs. 
        // We'll trust the caller passes 'importance'. 

        // 4. Time of Day check
        // If it's "deep focus" time (from patterns), reduce tolerance.

        // Simple Threshold logic
        return context.importance > (1 - tolerance);
    }

    /**
     * Updates the user's persona based on new observations.
     * This versions the persona to maintain history.
     */
    async updatePersona(userId: string, newTraits: any, source: string) {
        const user = await userRepository.findWithPersona(userId);
        if (!user) throw new Error("User not found");

        const userAny = user as any;
        const latestSnapshot = userAny.personaSnapshots?.[0];
        const currentVersion = latestSnapshot?.version || 0;
        const currentTraits = latestSnapshot?.traits ? (latestSnapshot.traits as any) : {};

        // Merge traits (shallow merge for now)
        const updatedTraits = { ...currentTraits, ...newTraits };

        // Create new snapshot
        const newSnapshot = await (prisma as any).personaSnapshot.create({
            data: {
                userId,
                version: currentVersion + 1,
                traits: updatedTraits,
                confidence: { source, timestamp: new Date() }, // metadata
                meta: { trigger: source }
            }
        });

        // Also update UserProfile currentPersonaVersion
        await prisma.user.update({
            where: { id: userId },
            data: { currentPersonaVersion: newSnapshot.version } as any
        });

        return newSnapshot;
    }
}

export const intelligenceService = new IntelligenceService();
