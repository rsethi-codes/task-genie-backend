import { geminiModel } from "../../config/gemini.js";
import { AI_MODE } from "../../config/ai-config.js";
import type {
  AIProvider,
  AIProviderResult,
  AIRequestMeta,
  BreakTaskIntoSubtasksInput,
  ExecutionGuidanceInput,
  JournalAssistInput,
  PersonaAnalysisInput,
  ReflectionSummaryInput,
  RefinementAnalysisInput,
  TaskEnrichmentInput,
  NodeGenerationInput,
  NodeExpansionInput,
  SubtaskSuggestion,
  NodeSuggestion,
  PersonaAnalysisOutput,
  ExecutionGuidanceOutput,
  JournalAssistOutput,
  ReflectionSummaryOutput,
  TaskEnrichmentOutput,
  RefinementAnalysisOutput,
} from "../ai-provider.js";

function stableHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function extractFirstJsonObject(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

function extractFirstJsonArray(text: string): string {
  const match = text.match(/\[[\s\S]*\]/);
  if (match) return match[0];
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

export class GeminiAIProvider implements AIProvider {
  private providerName: AIProviderResult<unknown>["provider"] = "GeminiAIProvider";

  private withMeta<T>(feature: AIProviderResult<T>["feature"], data: T, prompt: string): AIProviderResult<T> {
    return {
      data,
      aiMode: AI_MODE,
      provider: this.providerName,
      feature,
      promptHash: stableHash(prompt),
    };
  }

  async generatePersona(input: PersonaAnalysisInput, meta: AIRequestMeta): Promise<AIProviderResult<PersonaAnalysisOutput>> {
    const prompt = `
You are a persona analysis engine.

INPUT (JSON):
${JSON.stringify(input.answers)}

Return JSON only with schema:
{
  "persona": "Planner" | "Procrastinator" | "Overachiever" | "Anxious Starter" | "General",
  "confidence": number,
  "traits": object
}
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = extractFirstJsonObject(text);
    const data = JSON.parse(jsonStr) as PersonaAnalysisOutput;
    return this.withMeta("PersonaAnalysis", data, prompt);
  }

  async breakTaskIntoSubtasks(
    input: BreakTaskIntoSubtasksInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<SubtaskSuggestion[]>> {
    // Keep for backward compatibility but delegate to node logic conceptually
    const prompt = `
You are TaskGenie, an intelligent task planner.
GOAL: Break down the task into subtasks.
...
`;
    // implementation same as before...
    return this.generateNodes(input, meta).then(res => ({
      ...res,
      data: res.data.map(n => ({
        title: n.title,
        description: n.description,
        estimatedDuration: n.estimatedDuration,
        energyRequired: n.energyRequired
      }))
    }));
  }

  async generateNodes(
    input: NodeGenerationInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<NodeSuggestion[]>> {
    let personaContext = "The user is a general user.";
    const userAny = input.user as any;
    if (userAny?.personaSnapshots && userAny.personaSnapshots.length > 0) {
      const snap = userAny.personaSnapshots[0];
      personaContext = `User Traits: ${JSON.stringify(snap.traits)}.`;
    }

    const task = input.task as any;
    const prompt = `
You are TaskGenie, an AI-powered execution coach.

GOAL: Break down a long-term goal (ROOT) into a structural program.

USER PERSONA:
${personaContext}

ROOT TASK:
Title: ${task.title}
Description: ${task.description || "No description"}

INSTRUCTIONS:
1. Generate 3-5 PHASE nodes (milestones) that span the project.
2. For each PHASE, optionally generate 1-2 DAILY nodes (repeatable habits/execution) or ACTION nodes.
3. Attach GUIDANCE nodes where contextual coaching is helpful.
4. DISTINGUISH TYPES:
   - PHASE: Multi-day/week milestones.
   - DAILY: Repeatable execution guidance (habit-like).
   - ACTION: One-off executable steps.
   - GUIDANCE: Non-completable supporting insight (context, "Watch out for X").

OUTPUT FORMAT (JSON ARRAY):
[
  {
    "title": "...",
    "description": "...",
    "nodeType": "PHASE" | "DAILY" | "ACTION" | "GUIDANCE",
    "isCompletable": boolean,
    "estimatedDuration": number (mins),
    "energyRequired": "low" | "medium" | "high",
    "temporalIntent": "today" | "daily" | "phase" | "anytime",
    "children": [ ... recursively same structure ... ]
  }
]
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = extractFirstJsonArray(text);
    const data = JSON.parse(jsonStr) as NodeSuggestion[];

    return this.withMeta("NodeGeneration", data, prompt);
  }

  async expandNode(
    input: NodeExpansionInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<NodeSuggestion[]>> {
    const prompt = `
You are TaskGenie, an AI-powered execution coach.

GOAL: Expand a node into more granular execution details.
Expansion Type: ${input.expansionType}

CONTEXT:
Parent Node: ${input.node.title}
Description: ${input.node.description || "N/A"}
Node Type: ${input.node.nodeType}

INSTRUCTIONS:
- If ROOT_TO_PHASE: Generate milestones.
- If PHASE_TO_DAILY: Generate repeatable Focus/Daily nodes.
- If DAILY_TO_ACTION: Generate specific steps for "today".
- APPEND ONLY: Suggest new nodes that don't exist yet.
- PRESERVE LINEAGE: Keep the focus on ${input.node.title}.

OUTPUT FORMAT (JSON ARRAY):
[
  {
    "title": "...",
    "description": "...",
    "nodeType": "...",
    "isCompletable": boolean,
    ...
  }
]
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = extractFirstJsonArray(text);
    const data = JSON.parse(jsonStr) as NodeSuggestion[];

    return this.withMeta("NodeExpansion", data, prompt);
  }

  async generateExecutionGuidance(
    input: ExecutionGuidanceInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<ExecutionGuidanceOutput>> {
    const prompt = `
You are an execution coach.

Task:
${JSON.stringify({ title: input.task?.title, description: input.task?.description })}

Return JSON only with schema:
{
  "checklist": [{"title": string, "done": false}],
  "timeboxMinutes": number,
  "nextActionPrompt": string,
  "nudge": string
}
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = extractFirstJsonObject(text);
    const data = JSON.parse(jsonStr) as ExecutionGuidanceOutput;

    return this.withMeta("ExecutionGuidance", data, prompt);
  }

  async journalAssist(input: JournalAssistInput, meta: AIRequestMeta): Promise<AIProviderResult<JournalAssistOutput>> {
    const prompt = `
You are a journaling assistant.

User input:
${input.prompt}

Return JSON only with schema:
{
  "moodTags": string[],
  "sentenceStarters": string[],
  "promptScaffold": string
}
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = extractFirstJsonObject(text);
    const data = JSON.parse(jsonStr) as JournalAssistOutput;

    return this.withMeta("Journaling", data, prompt);
  }

  async reflectionSummary(
    input: ReflectionSummaryInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<ReflectionSummaryOutput>> {
    const prompt = `
You are a reflection summarizer.

Entries:
${JSON.stringify(input.entries)}

Return JSON only with schema:
{
  "summary": string,
  "patterns": string[],
  "suggestedNextSteps": string[]
}
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = extractFirstJsonObject(text);
    const data = JSON.parse(jsonStr) as ReflectionSummaryOutput;

    return this.withMeta("Reflection", data, prompt);
  }

  async enrichTaskIntent(
    input: TaskEnrichmentInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<TaskEnrichmentOutput>> {
    let personaContext = "The user is a general user.";
    const userAny = input.user as any;
    if (userAny?.personaSnapshots && userAny.personaSnapshots.length > 0) {
      const snap = userAny.personaSnapshots[0];
      personaContext = `User Traits: ${JSON.stringify(snap.traits)}.`;
    }

    const prompt = `
You are TaskGenie, an intelligent task planner.

GOAL: Complete the task details based on the user's short intent.

USER PERSONA:
${personaContext}

INTENT:
"${input.title}"

INSTRUCTIONS:
1. Predict the following fields:
   - description: A more detailed explanation or breakdown of the goal.
   - priority: LOW | MEDIUM | HIGH | URGENT (must match these exact strings).
   - category: A single word or short phrase (e.g., Work, Personal, Health, Finance).
   - dueDate: An ISO 8601 date string if a time is mentioned or implied, otherwise null.
   - reasoning: A short 1-sentence explanation of why these values were chosen.

OUTPUT FORMAT (JSON ONLY):
{
  "description": "...",
  "priority": "...",
  "category": "...",
  "dueDate": "...",
  "reasoning": "..."
}
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = extractFirstJsonObject(text);
    const data = JSON.parse(jsonStr) as TaskEnrichmentOutput;

    return this.withMeta("TaskEnrichment", data, prompt);
  }

  async analyzeRefinement(
    input: RefinementAnalysisInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<RefinementAnalysisOutput>> {
    const prompt = `
You are a Pattern Analyst AI.

TASK: Compare the Original AI Plan vs. the User's Final Plan.
Identify ONE behavior pattern that explains the changes.

ORIGINAL:
${JSON.stringify(input.originalPlan)}

FINAL (USER EDITED):
${JSON.stringify(input.finalPlan)}

OUTPUT FORMAT (JSON ONLY):
{
  "patternType": "detail_oriented" | "big_picture" | "low_interruption_tolerance" | "high_autonomy",
  "confidence": 0.1,
  "observation": "...",
  "context": {}
}
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = extractFirstJsonObject(text);
    const data = JSON.parse(jsonStr) as RefinementAnalysisOutput;

    return this.withMeta("RefinementAnalysis", data, prompt);
  }
}
