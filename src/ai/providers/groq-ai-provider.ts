import OpenAI from "openai";
import { AI_MODE } from "../../config/ai-config.js";
import { promptHash, requireJsonArray, requireJsonObject } from "../utils/ai-json.js";
import type {
  AIProvider,
  AIProviderResult,
  AIRequestMeta,
  BreakTaskIntoSubtasksInput,
  NodeGenerationInput,
  NodeExpansionInput,
  ExecutionGuidanceInput,
  JournalAssistInput,
  PersonaAnalysisInput,
  ReflectionSummaryInput,
  TaskEnrichmentInput,
  RefinementAnalysisInput,
  SubtaskSuggestion,
  NodeSuggestion,
  PersonaAnalysisOutput,
  ExecutionGuidanceOutput,
  JournalAssistOutput,
  ReflectionSummaryOutput,
  TaskEnrichmentOutput,
  RefinementAnalysisOutput,
} from "../ai-provider.js";
import { breakTaskIntoSubtasksPrompt, expandNodePrompt, taskEnrichmentPrompt } from "../prompts/groq-prompts.js";
import { logger } from "../../lib/logger.js";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const DEFAULT_LONG_MODEL = "mixtral-8x7b-32768";
const DEFAULT_TIMEOUT_MS = 10_000;

function groqBaseUrl(): string {
  return (process.env.GROQ_BASE_URL || DEFAULT_BASE_URL).trim();
}

function groqModel(): string {
  return (process.env.GROQ_MODEL || DEFAULT_MODEL).trim();
}

function groqLongModel(): string {
  return (process.env.GROQ_LONG_MODEL || DEFAULT_LONG_MODEL).trim();
}

function groqTimeoutMs(): number {
  const raw = (process.env.GROQ_TIMEOUT_MS || "").trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_TIMEOUT_MS;
}

function shouldUseLongModel(prompt: string) {
  return prompt.length > 8000;
}

function isRetryableGroqError(error: any): boolean {
  const status = error?.status ?? error?.response?.status;
  if (status === 429) return true;
  if (typeof status === "number" && status >= 500) return true;
  if (error?.name === "AbortError") return true;
  return false;
}

function systemMessage() {
  return "You are an AI assistant for Task Genie - a productivity app. Return ONLY valid JSON matching the schema. No markdown. No explanations.";
}

export class GroqAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }

    this.client = new OpenAI({ apiKey, baseURL: groqBaseUrl() });
  }

  private async completeJson(prompt: string, meta: AIRequestMeta): Promise<{ text: string; model: string; promptHash: string }> {
    const model = shouldUseLongModel(prompt) ? groqLongModel() : groqModel();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), groqTimeoutMs());

    try {
      const resp = await this.client.chat.completions.create(
        {
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: systemMessage() },
            { role: "user", content: prompt },
          ],
        },
        { signal: controller.signal }
      );

      const content = resp.choices?.[0]?.message?.content ?? "";
      return { text: content, model, promptHash: promptHash(prompt) };
    } finally {
      clearTimeout(timeout);
    }
  }

  private wrap<T>(feature: AIProviderResult<T>["feature"], data: T, model: string, pHash: string): AIProviderResult<T> {
    return {
      data,
      aiMode: AI_MODE,
      provider: "Groq",
      model,
      feature,
      promptHash: pHash,
    };
  }

  async generatePersona(input: PersonaAnalysisInput, meta: AIRequestMeta): Promise<AIProviderResult<PersonaAnalysisOutput>> {
    const prompt = `FEATURE: PersonaAnalysis\n\nINPUT (JSON):\n${JSON.stringify(input.answers)}\n\nReturn JSON only with schema:\n{\n  \"persona\": string,\n  \"confidence\": number,\n  \"traits\": object\n}`;

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const data = requireJsonObject(text) as PersonaAnalysisOutput;
    return this.wrap("PersonaAnalysis", data, model, pHash);
  }

  async breakTaskIntoSubtasks(
    input: BreakTaskIntoSubtasksInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<SubtaskSuggestion[]>> {
    const task = input.task as any;

    const prompt = breakTaskIntoSubtasksPrompt(input);

    logger.info("GroqAIProvider:breakTaskIntoSubtasks", { prompt });

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const arr = requireJsonArray(text) as SubtaskSuggestion[];
    const data = arr.slice(0, 7);
    return this.wrap("SubtaskGeneration", data, model, pHash);
  }

  async generateNodes(
    input: NodeGenerationInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<NodeSuggestion[]>> {
    // Use the same prompt as breakTaskIntoSubtasks but return NodeSuggestion format
    const prompt = breakTaskIntoSubtasksPrompt(input);

    logger.info("GroqAIProvider:generateNodes", { prompt });

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const arr = requireJsonArray(text) as NodeSuggestion[];
    const data = arr.slice(0, 7);
    return this.wrap("NodeGeneration", data, model, pHash);
  }

  async expandNode(
    input: NodeExpansionInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<NodeSuggestion[]>> {
    const prompt = expandNodePrompt(input);

    logger.info("GroqAIProvider:expandNode", { prompt });

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const arr = requireJsonArray(text) as NodeSuggestion[];
    const data = arr.slice(0, 7);
    return this.wrap("NodeExpansion", data, model, pHash);
  }

  async generateExecutionGuidance(
    input: ExecutionGuidanceInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<ExecutionGuidanceOutput>> {
    const prompt = `FEATURE: ExecutionGuidance\n\nCONTEXT (JSON):\n${JSON.stringify({
      task: { title: input.task?.title, description: input.task?.description },
      subtask: input.subtask ? { title: input.subtask?.title, description: input.subtask?.description } : null,
    })}\n\nReturn JSON only with schema:\n{\n  \"checklist\": [{\"title\": string, \"done\": false}],\n  \"timeboxMinutes\": number,\n  \"nextActionPrompt\": string,\n  \"nudge\": string\n}\nRules: checklist-based, concrete, no motivational fluff.`;

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const data = requireJsonObject(text) as ExecutionGuidanceOutput;
    return this.wrap("ExecutionGuidance", data, model, pHash);
  }

  async journalAssist(input: JournalAssistInput, meta: AIRequestMeta): Promise<AIProviderResult<JournalAssistOutput>> {
    const prompt = `FEATURE: Journaling\n\nUSER_INPUT:\n${input.prompt}\n\nReturn JSON only with schema:\n{\n  \"moodTags\": string[],\n  \"sentenceStarters\": string[],\n  \"promptScaffold\": string\n}`;

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const data = requireJsonObject(text) as JournalAssistOutput;
    return this.wrap("Journaling", data, model, pHash);
  }

  async reflectionSummary(
    input: ReflectionSummaryInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<ReflectionSummaryOutput>> {
    const prompt = `FEATURE: Reflection\n\nENTRIES (JSON):\n${JSON.stringify(input.entries)}\n\nReturn JSON only with schema:\n{\n  \"summary\": string,\n  \"patterns\": string[],\n  \"suggestedNextSteps\": string[]\n}\nRules: include pattern detection and next steps.`;

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const data = requireJsonObject(text) as ReflectionSummaryOutput;
    return this.wrap("Reflection", data, model, pHash);
  }

  async enrichTaskIntent(input: TaskEnrichmentInput, meta: AIRequestMeta): Promise<AIProviderResult<TaskEnrichmentOutput>> {
    // const prompt = `FEATURE: TaskEnrichment\n\nINTENT:\n${input.title}\n\nReturn JSON only with schema:\n{\n  \"description\": string,\n  \"priority\": \"LOW\" | \"MEDIUM\" | \"HIGH\" | \"URGENT\",\n  \"category\": string,\n  \"dueDate\": string | null,\n  \"reasoning\": string\n}`;
    const prompt = taskEnrichmentPrompt(input);

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const data = requireJsonObject(text) as TaskEnrichmentOutput;
    return this.wrap("TaskEnrichment", data, model, pHash);
  }

  async analyzeRefinement(
    input: RefinementAnalysisInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<RefinementAnalysisOutput>> {
    const prompt = `FEATURE: RefinementAnalysis\n\nORIGINAL (JSON):\n${JSON.stringify(input.originalPlan)}\n\nFINAL (JSON):\n${JSON.stringify(input.finalPlan)}\n\nReturn JSON only with schema:\n{\n  \"patternType\": \"detail_oriented\" | \"big_picture\" | \"low_interruption_tolerance\" | \"high_autonomy\",\n  \"confidence\": number,\n  \"observation\": string,\n  \"context\": object\n}`;

    const { text, model, promptHash: pHash } = await this.completeJson(prompt, meta);
    const data = requireJsonObject(text) as RefinementAnalysisOutput;
    return this.wrap("RefinementAnalysis", data, model, pHash);
  }

  static isRetryableError(error: any) {
    return isRetryableGroqError(error);
  }
}
