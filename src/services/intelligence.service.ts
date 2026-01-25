import { runWithAIFallback } from "../ai/get-ai-provider.js";
import { userRepository } from "../repositories/user.repository.js";
import { taskRepository } from "../repositories/task.repository.js";
import { prisma } from "../config/db.js";
import { TaskNode, NodeType, TemporalIntent, NodeStatus, BehaviorPattern } from "@prisma/client";
import { NodeSuggestion } from "../ai/ai-provider.js";

export class IntelligenceService {

    /**
     * Generates hierarchical task nodes for a task based on user persona and task context.
     */
    async generateNodes(userId: string, taskId: string): Promise<TaskNode[]> {
        const user = await userRepository.findWithPersona(userId);
        if (!user) throw new Error("User not found");

        const task = await taskRepository.findById(taskId, userId);
        if (!task) throw new Error("Task not found");

        // Safety: If this task already has children, avoid re-generating unless forced (or handle idempotency)
        const existingChildren = await (prisma as any).taskNode.findMany({
            where: { parentId: taskId, userId }
        });
        if (existingChildren.length > 0) {
            return existingChildren; // Idempotency: don't double generate
        }

        try {
            const { result: providerResult } = await runWithAIFallback(
                { feature: "NodeGeneration", userId },
                (provider) => provider.generateNodes({ user, task }, { feature: "NodeGeneration", userId })
            );

            const aiProposedNodes = providerResult.data;

            // Guardrail: Limit node count as per requirements (3-7 top-level nodes)
            const limitedNodes = aiProposedNodes.slice(0, 7);

            // Save nodes preserving hierarchy
            // Second arg is rootTaskId, fifth arg is parentId
            const createdNodes = await this.saveNodeHierarchy(
                userId,
                task.rootTaskId,
                limitedNodes,
                providerResult,
                taskId
            );

            return createdNodes;

        } catch (error: any) {
            console.error("AI NodeGeneration Error:", error);
            throw new Error(`Failed to generate nodes: ${error.message}`);
        }
    }

    /**
     * Recursively expands a node into child nodes.
     */
    async expandNode(userId: string, nodeId: string, expansionType: 'PHASE_TO_DAILY' | 'DAILY_TO_ACTION' | 'ROOT_TO_PHASE'): Promise<TaskNode[]> {
        const user = await userRepository.findWithPersona(userId);
        if (!user) throw new Error("User not found");

        const node = await (prisma as any).taskNode.findFirst({
            where: { id: nodeId, userId },
            include: { parent: true }
        });
        if (!node) throw new Error("Node not found");

        // AI Safety & Trust Rules
        // 1. AI must NEVER overwrite or delete user-edited nodes (handled by append-only logic)
        // 2. AI may only APPEND new nodes when expanding
        // 3. COMPLETED nodes are immutable by AI
        if (node.status === NodeStatus.COMPLETED) {
            throw new Error("Cannot expand a completed node.");
        }

        // Idempotency check: If node already has certain types of children, maybe skip?
        // For now, allow multiple expansions but append.

        try {
            const { result: providerResult } = await runWithAIFallback(
                { feature: "NodeExpansion", userId },
                (provider) => provider.expandNode(
                    {
                        user,
                        node,
                        parentNode: node.parent,
                        expansionType
                    },
                    { feature: "NodeExpansion", userId }
                )
            );

            const aiProposedChildren = providerResult.data;

            // Guardrail: Limit children count
            const limitedChildren = aiProposedChildren.slice(0, 7);

            // Save child nodes (rootTaskId is preserved from the parent)
            const createdChildren = await this.saveNodeChildren(userId, nodeId, node.rootTaskId, limitedChildren, providerResult);

            return createdChildren;

        } catch (error: any) {
            console.error("AI NodeExpansion Error:", error);
            throw new Error(`Failed to expand node: ${error.message}`);
        }
    }

    /**
     * Saves a hierarchy of nodes recursively.
     */
    private async saveNodeHierarchy(
        userId: string,
        rootTaskId: string,
        nodes: NodeSuggestion[],
        providerResult: any,
        parentId?: string,
        order: number = 0
    ): Promise<TaskNode[]> {
        const createdNodes = [];

        for (const nodeSuggestion of nodes) {
            // Normalize energy level
            let energy = (nodeSuggestion.energyRequired || 'medium').toLowerCase();
            if (energy === 'very low') energy = 'very_low';
            if (energy === 'very high') energy = 'very_high';

            const validEnergies = ['very_low', 'low', 'medium', 'high', 'very_high'];
            if (!validEnergies.includes(energy)) energy = 'medium';

            const createdNode = await (prisma as any).taskNode.create({
                data: {
                    userId,
                    parentId: parentId || null,
                    rootTaskId,
                    title: nodeSuggestion.title,
                    description: nodeSuggestion.description,
                    nodeType: nodeSuggestion.nodeType as NodeType,
                    status: nodeSuggestion.isCompletable ? NodeStatus.DRAFT : null,
                    order: order++,
                    estimatedDuration: nodeSuggestion.estimatedDuration,
                    energyRequired: energy as any,
                    temporalIntent: (nodeSuggestion.temporalIntent as TemporalIntent) || TemporalIntent.anytime,
                    isCompletable: nodeSuggestion.isCompletable !== false,
                    aiGenerated: true,
                    aiMetadata: {
                        aiMode: providerResult.aiMode,
                        provider: providerResult.provider,
                        feature: providerResult.feature,
                        promptHash: providerResult.promptHash,
                        lineage: parentId ? { parentId } : undefined
                    },
                    aiGenerationStatus: 'READY'
                }
            });

            createdNodes.push(createdNode);

            // Recursively save children
            if (nodeSuggestion.children && nodeSuggestion.children.length > 0) {
                const childNodes = await this.saveNodeHierarchy(
                    userId,
                    rootTaskId,
                    nodeSuggestion.children,
                    providerResult,
                    createdNode.id,
                    0
                );
                createdNodes.push(...childNodes);
            }
        }

        return createdNodes;
    }

    /**
     * Saves child nodes for expansion.
     */
    private async saveNodeChildren(
        userId: string,
        parentId: string,
        rootTaskId: string,
        children: NodeSuggestion[],
        providerResult: any
    ): Promise<TaskNode[]> {
        // Get existing children to determine next order
        const existingChildren = await (prisma as any).taskNode.findMany({
            where: { parentId },
            orderBy: { order: 'desc' },
            take: 1
        });

        const nextOrder = existingChildren.length > 0 ? existingChildren[0].order + 1 : 0;

        return this.saveNodeHierarchy(userId, rootTaskId, children, providerResult, parentId, nextOrder);
    }

    /**
     * Gets today's focus - all DAILY nodes and ACTION nodes with temporalIntent 'today'.
     */
    async getTodaysFocus(userId: string): Promise<TaskNode[]> {
        const todaysNodes = await (prisma as any).taskNode.findMany({
            where: {
                userId,
                OR: [
                    { nodeType: 'DAILY', status: { not: NodeStatus.COMPLETED } },
                    { temporalIntent: 'today', status: { not: NodeStatus.COMPLETED } }
                ],
                deletedAt: null
            },
            include: {
                parent: true,
                rootTask: true
            },
            orderBy: [
                { temporalIntent: 'desc' }, // today first
                { order: 'asc' }
            ]
        });

        // Filter and enrich with context if needed
        return todaysNodes;
    }

    /**
     * Legacy method for backward compatibility - generates subtasks for existing tasks.
     */
    async generateSubtasks(userId: string, taskId: string): Promise<TaskNode[]> {
        // For now, delegate to the new node generation system
        return this.generateNodes(userId, taskId);
    }

    /**
     * Enriches a task intent string into a full task object.
     */
    async enrichTaskIntent(userId: string, title: string): Promise<any> {
        const user = await userRepository.findWithPersona(userId);
        if (!user) throw new Error("User not found");

        try {
            const { result: providerResult } = await runWithAIFallback(
                { feature: "TaskEnrichment", userId },
                (provider) => provider.enrichTaskIntent({ user, title }, { feature: "TaskEnrichment", userId })
            );

            return {
                ...providerResult.data,
                aiMetadata: {
                    aiMode: providerResult.aiMode,
                    provider: providerResult.provider,
                    feature: providerResult.feature,
                    promptHash: providerResult.promptHash,
                }
            };
        } catch (error: any) {
            console.error("Enrichment Error:", error);
            throw new Error(`Failed to enrich task intent: ${error.message}`);
        }
    }

    async captureRefinementSignal(userId: string, nodeId: string, finalSubtasks: any[]) {
        const session = await (prisma as any).refinementSession.findUnique({
            where: { nodeId }
        });

        if (session) {
            await prisma.refinementSession.update({
                where: { id: session.id },
                data: {
                    finalPlan: finalSubtasks,
                    status: "finalized",
                    updatedAt: new Date()
                }
            });

            this.analyzeRefinement(userId, nodeId, session.originalPlan, finalSubtasks).catch(err => {
                console.error("[Learning] analysis failed", err);
            });
        }
    }

    async analyzeRefinement(userId: string, nodeId: string, original: any, final: any) {
        try {
            const { result: providerResult } = await runWithAIFallback(
                { feature: "RefinementAnalysis", userId },
                (provider) => provider.analyzeRefinement(
                    { originalPlan: original, finalPlan: final },
                    { feature: "RefinementAnalysis", userId }
                )
            );

            const analysis = providerResult.data;

            if (analysis && analysis.patternType) {
                await (prisma as any).behaviorPattern.create({
                    data: {
                        userId,
                        patternType: analysis.patternType,
                        confidence: analysis.confidence,
                        lastObserved: new Date(),
                        context: (analysis.context ?? {}) as any
                    }
                });
            }
        } catch (error) {
            console.error("Pattern analysis failed:", error);
        }
    }

    async shouldNotify(userId: string, context: { type: 'start' | 'resume' | 'completion', importance: number }): Promise<boolean> {
        const user = await userRepository.findWithPersona(userId);
        if (!user) return false;

        let tolerance = 0.5;
        const userAny = user as any;
        if (userAny.behaviorPatterns) {
            const intolerant = userAny.behaviorPatterns.some((p: any) => p.patternType === 'low_interruption_tolerance');
            if (intolerant) tolerance = 0.2;
        }

        return context.importance > (1 - tolerance);
    }

    async updatePersona(userId: string, newTraits: any, source: string) {
        const user = await userRepository.findWithPersona(userId);
        if (!user) throw new Error("User not found");

        const userAny = user as any;
        const latestSnapshot = userAny.personaSnapshots?.[0];
        const currentVersion = latestSnapshot?.version || 0;
        const currentTraits = latestSnapshot?.traits ? (latestSnapshot.traits as any) : {};

        const updatedTraits = { ...currentTraits, ...newTraits };

        // Create the persona snapshot
        const newSnapshot = await prisma.personaSnapshot.create({
            data: {
                userId,
                version: currentVersion + 1,
                traits: updatedTraits,
                confidence: { source, timestamp: new Date(), value: newTraits.confidence || 0.5 },
                meta: { trigger: source }
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { currentPersonaVersion: newSnapshot.version }
        });

        // If this is from onboarding, also create/update the UserProfile with structured data
        if (source === 'onboarding_completion') {
            await this.createOrUpdateUserProfileFromOnboarding(userId, updatedTraits);
        }

        return newSnapshot;
    }

    private async createOrUpdateUserProfileFromOnboarding(userId: string, traits: any) {
        const profileData: any = {};

        // Map onboarding answers to UserProfile structured fields
        if (traits.onb_default_priority) {
            const priorityMap: Record<string, string> = {
                "Medium": "MEDIUM",
                "High": "HIGH",
                "Low": "LOW",
                "Urgent only when needed": "URGENT"
            };
            profileData.defaultPriority = priorityMap[traits.onb_default_priority] || "MEDIUM";
        }

        if (traits.onb_work_start) {
            profileData.workStartTime = traits.onb_work_start;
        }

        if (traits.onb_work_end) {
            profileData.workEndTime = traits.onb_work_end;
        }

        if (traits.onb_break_duration) {
            const durationMap: Record<string, number> = {
                "5 min": 5,
                "10 min": 10,
                "15 min": 15,
                "25 min": 25
            };
            profileData.breakDuration = durationMap[traits.onb_break_duration];
        }

        if (traits.onb_default_duration) {
            const durationMap: Record<string, number> = {
                "15 min": 15,
                "30 min": 30,
                "45 min": 45,
                "60 min": 60
            };
            profileData.defaultDuration = durationMap[traits.onb_default_duration];
        }

        // Only update if we have structured data to save
        if (Object.keys(profileData).length > 0) {
            await prisma.userProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    ...profileData
                },
                update: {
                    ...profileData
                }
            });
        }
    }
}

export const intelligenceService = new IntelligenceService();
