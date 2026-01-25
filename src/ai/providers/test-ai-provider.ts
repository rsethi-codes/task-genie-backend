import { AI_MODE } from "../../config/ai-config.js";
import type { EnergyLevel, Priority } from "@prisma/client";
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
  SubtaskSuggestion,
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

function normalizeText(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class TestAIProvider implements AIProvider {
  private providerName: AIProviderResult<unknown>["provider"] = "TestAIProvider";

  private withMeta<T>(feature: AIProviderResult<T>["feature"], data: T, promptBasis: string): AIProviderResult<T> {
    return {
      data,
      aiMode: AI_MODE,
      provider: this.providerName,
      feature,
      promptHash: stableHash(promptBasis),
    };
  }

  async generatePersona(input: PersonaAnalysisInput, meta: AIRequestMeta): Promise<AIProviderResult<PersonaAnalysisOutput>> {
    const text = normalizeText(input.answers).toLowerCase();

    const anxiousSignals = ["anxious", "overwhelmed", "stress", "stressed", "worried", "panic", "fear"];
    const procrastSignals = ["later", "procrast", "avoid", "delay", "stuck", "can't start", "cant start"];
    const overachieveSignals = ["perfect", "optimize", "maximize", "ambitious", "high standard", "hustle"];
    const plannerSignals = ["plan", "schedule", "checklist", "calendar", "structure", "routine", "steps"];

    const score = (signals: string[]) => signals.reduce((acc, s) => (text.includes(s) ? acc + 1 : acc), 0);

    const anxious = score(anxiousSignals);
    const procrast = score(procrastSignals);
    const overachieve = score(overachieveSignals);
    const planner = score(plannerSignals);

    const scored: Array<{ persona: PersonaAnalysisOutput["persona"]; s: number }> = [
      { persona: "Anxious Starter", s: anxious },
      { persona: "Procrastinator", s: procrast },
      { persona: "Overachiever", s: overachieve },
      { persona: "Planner", s: planner },
    ];

    scored.sort((a, b) => b.s - a.s);
    const best = scored[0];
    const runnerUp = scored[1];

    const persona = best.s === 0 ? "General" : best.persona;
    const confidence = best.s === 0 ? 0.55 : clamp(0.6 + (best.s - runnerUp.s) * 0.1, 0.6, 0.92);

    const traits: Record<string, unknown> = {
      persona,
      planningStyle: persona === "Planner" ? "structured" : persona === "Overachiever" ? "detailed" : "minimalist",
      motivationRisk: persona === "Procrastinator" ? "high" : persona === "Anxious Starter" ? "medium" : "low",
      preferredTone: persona === "Anxious Starter" ? "supportive" : persona === "Overachiever" ? "direct" : "neutral",
    };

    return this.withMeta("PersonaAnalysis", { persona, confidence, traits }, `${meta.feature}:${text}`);
  }

  async breakTaskIntoSubtasks(
    input: BreakTaskIntoSubtasksInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<SubtaskSuggestion[]>> {
    const title = normalizeText(input.task?.title).trim();
    const desc = normalizeText(input.task?.description).trim();
    const combined = `${title} ${desc}`.toLowerCase();

    const templates: Array<{ match: RegExp; subtasks: SubtaskSuggestion[] }> = [
      {
        match: /(login|sign\s?in|auth|authentication|signup|sign\s?up)/,
        subtasks: [
          { title: "Design UI", description: "Sketch the screen and states", estimatedDuration: 30, energyRequired: "low" as EnergyLevel },
          { title: "Implement form", description: "Inputs, validation, and submit", estimatedDuration: 45, energyRequired: "medium" as EnergyLevel },
          { title: "Connect API", description: "Wire up backend calls and error handling", estimatedDuration: 45, energyRequired: "medium" as EnergyLevel },
          { title: "Test validation", description: "Happy path + edge cases", estimatedDuration: 30, energyRequired: "low" as EnergyLevel },
        ],
      },
      {
        match: /(deploy|release|production|ship)/,
        subtasks: [
          { title: "Confirm requirements", description: "Target env, version, checklist", estimatedDuration: 15, energyRequired: "low" as EnergyLevel },
          { title: "Run build", description: "Build and verify artifacts", estimatedDuration: 20, energyRequired: "low" as EnergyLevel },
          { title: "Run tests", description: "Smoke tests and critical paths", estimatedDuration: 30, energyRequired: "medium" as EnergyLevel },
          { title: "Deploy", description: "Deploy with rollback plan", estimatedDuration: 30, energyRequired: "medium" as EnergyLevel },
        ],
      },
      {
        match: /(write|draft|blog|post|article|doc|documentation)/,
        subtasks: [
          { title: "Outline", description: "Bullets only", estimatedDuration: 15, energyRequired: "very_low" as EnergyLevel },
          { title: "First draft", description: "Write without editing", estimatedDuration: 40, energyRequired: "low" as EnergyLevel },
          { title: "Edit", description: "Clarity + structure", estimatedDuration: 25, energyRequired: "medium" as EnergyLevel },
          { title: "Publish", description: "Finalize and share", estimatedDuration: 10, energyRequired: "very_low" as EnergyLevel },
        ],
      },
    ];

    const matched = templates.find((t) => t.match.test(combined));
    if (matched) {
      return this.withMeta("SubtaskGeneration", matched.subtasks.slice(0, 7), `${meta.feature}:${combined}`);
    }

    const words = combined.split(/\s+/).filter(Boolean);
    const complexity = words.length;

    const generic: SubtaskSuggestion[] = [
      { title: "Clarify outcome", description: "Define what done means", estimatedDuration: 10, energyRequired: "very_low" as EnergyLevel },
      { title: "List steps", description: "Write 3-7 concrete actions", estimatedDuration: 15, energyRequired: "low" as EnergyLevel },
      { title: "Do first small step", description: "Start with the easiest part", estimatedDuration: 20, energyRequired: "low" as EnergyLevel },
    ];

    if (complexity > 12) {
      generic.push({
        title: "Timebox execution",
        description: "Work in focused blocks, then reassess",
        estimatedDuration: 30,
        energyRequired: "medium" as EnergyLevel,
      });
    }

    return this.withMeta("SubtaskGeneration", generic.slice(0, 7), `${meta.feature}:${combined}`);
  }

  async generateExecutionGuidance(
    input: ExecutionGuidanceInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<ExecutionGuidanceOutput>> {
    const taskTitle = normalizeText(input.task?.title).trim();
    const checklist = [
      { title: "Pick the next 10-minute action", done: false },
      { title: "Remove one blocker (tool, tab, file, space)", done: false },
      { title: "Work for one short timebox", done: false },
      { title: "Write the next tiny step", done: false },
    ];

    const data: ExecutionGuidanceOutput = {
      checklist,
      timeboxMinutes: 25,
      nextActionPrompt: taskTitle ? `What is the smallest next action for: ${taskTitle}?` : "What is the smallest next action?",
      nudge: "Start messy, then improve. Momentum beats perfection.",
    };

    return this.withMeta("ExecutionGuidance", data, `${meta.feature}:${taskTitle}`);
  }

  async journalAssist(input: JournalAssistInput, meta: AIRequestMeta): Promise<AIProviderResult<JournalAssistOutput>> {
    const text = normalizeText(input.prompt).toLowerCase();
    const moodTags: string[] = [];
    if (/(happy|excited|great|good)/.test(text)) moodTags.push("positive");
    if (/(sad|down|tired|exhausted)/.test(text)) moodTags.push("low_energy");
    if (/(anxious|stress|stressed|worried)/.test(text)) moodTags.push("anxious");
    if (/(angry|frustrat|irritat)/.test(text)) moodTags.push("frustrated");
    if (moodTags.length === 0) moodTags.push("neutral");

    const data: JournalAssistOutput = {
      moodTags,
      sentenceStarters: [
        "Right now I feel...",
        "The main thing on my mind is...",
        "One small win I had today was...",
        "A challenge I faced was...",
        "Tomorrow, I want to focus on...",
      ],
      promptScaffold: "Write 3-5 sentences. Keep it concrete: situation, feeling, next step.",
    };

    return this.withMeta("Journaling", data, `${meta.feature}:${text}`);
  }

  async reflectionSummary(
    input: ReflectionSummaryInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<ReflectionSummaryOutput>> {
    const joined = input.entries.map((e) => normalizeText(e.text)).join("\n").toLowerCase();

    const patterns: string[] = [];
    if (/(stuck|blocked|overwhelmed)/.test(joined)) patterns.push("friction_present");
    if (/(progress|done|finished|shipped|completed)/.test(joined)) patterns.push("momentum");
    if (/(late|tomorrow|delay|procrast)/.test(joined)) patterns.push("avoidance_risk");
    if (patterns.length === 0) patterns.push("mixed");

    const data: ReflectionSummaryOutput = {
      summary: "This week had a mix of progress and friction. Focus on one small next step at a time.",
      patterns,
      suggestedNextSteps: [
        "Pick one priority for tomorrow",
        "Timebox a 25-minute session",
        "Remove the biggest blocker first",
      ],
    };

    return this.withMeta("Reflection", data, `${meta.feature}:${joined}`);
  }

  async enrichTaskIntent(
    input: TaskEnrichmentInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<TaskEnrichmentOutput>> {
    const title = normalizeText(input.title).trim();
    const lower = title.toLowerCase();

    const category = /(work|project|client|meeting)/.test(lower)
      ? "Work"
      : /(gym|health|run|workout|doctor)/.test(lower)
        ? "Health"
        : /(money|invoice|tax|budget)/.test(lower)
          ? "Finance"
          : "General";

    const priority = /(urgent|asap|today|deadline)/.test(lower)
      ? ("HIGH" as Priority)
      : /(someday|whenever|optional)/.test(lower)
        ? ("LOW" as Priority)
        : ("MEDIUM" as Priority);

    const data: TaskEnrichmentOutput = {
      description: title ? `Goal: ${title}. Define success criteria and the first action.` : "Define the goal and first action.",
      priority,
      category,
      dueDate: null,
      reasoning: "Deterministic enrichment based on keywords and default rules.",
    };

    return this.withMeta("TaskEnrichment", data, `${meta.feature}:${lower}`);
  }

  async analyzeRefinement(
    input: RefinementAnalysisInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<RefinementAnalysisOutput>> {
    const original = normalizeText(input.originalPlan);
    const final = normalizeText(input.finalPlan);

    const originalLen = original.length;
    const finalLen = final.length;

    const patternType: RefinementAnalysisOutput["patternType"] =
      finalLen > originalLen * 1.2
        ? "detail_oriented"
        : finalLen < originalLen * 0.8
          ? "big_picture"
          : "high_autonomy";

    const data: RefinementAnalysisOutput = {
      patternType,
      confidence: 0.7,
      observation: "Detected a consistent edit style based on plan size changes.",
      context: {
        originalSize: originalLen,
        finalSize: finalLen,
      },
    };

    return this.withMeta("RefinementAnalysis", data, `${meta.feature}:${originalLen}:${finalLen}`);
  }

  async generateNodes(input: any, meta: AIRequestMeta): Promise<AIProviderResult<any>> {
    const title = normalizeText(input.task?.title).toLowerCase();
    const mockNodes = [
      { title: "Define Core Scope", nodeType: "PHASE", isCompletable: true },
      { title: "Analyze Requirements", nodeType: "PHASE", isCompletable: true },
      { title: "Immediate Next Action", nodeType: "ACTION", isCompletable: true, temporalIntent: "today" }
    ];

    if (title.includes("deploy")) {
      mockNodes[0].title = "Stage Build";
      mockNodes[1].title = "Verify Health";
    }

    return this.withMeta("NodeGeneration", mockNodes, `${meta.feature}:${title}`);
  }

  async expandNode(input: any, meta: AIRequestMeta): Promise<AIProviderResult<any>> {
    const nodeTitle = normalizeText(input.node?.title).toLowerCase();
    const mockChildren = [
      { title: `Step 1 for ${nodeTitle}`, nodeType: "ACTION", isCompletable: true },
      { title: `Step 2 for ${nodeTitle}`, nodeType: "ACTION", isCompletable: true }
    ];

    return this.withMeta("NodeExpansion", mockChildren, `${meta.feature}:${nodeTitle}`);
  }
}
