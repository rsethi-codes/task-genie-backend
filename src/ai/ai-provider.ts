import type { EnergyLevel, Priority } from "@prisma/client";

// Temporary enum definitions until Prisma client is regenerated
export enum NodeType {
  ROOT = "ROOT",
  PHASE = "PHASE", 
  DAILY = "DAILY",
  ACTION = "ACTION",
  GUIDANCE = "GUIDANCE"
}

export enum TemporalIntent {
  today = "today",
  daily = "daily", 
  phase = "phase",
  anytime = "anytime"
}

export enum NodeStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED", 
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED"
}

export type AIFeature =
  | "PersonaAnalysis"
  | "NodeGeneration"
  | "NodeExpansion"
  | "SubtaskGeneration" // Keep for backward compatibility
  | "ExecutionGuidance"
  | "Journaling"
  | "Reflection"
  | "TaskEnrichment"
  | "RefinementAnalysis";

export type AIProviderName = "TestAIProvider" | "GeminiAIProvider" | "Groq";

export interface AIRequestMeta {
  feature: AIFeature;
  userId?: string;
  correlationId?: string;
}

export interface AIProviderResult<T> {
  data: T;
  aiMode: "TEST" | "PROD";
  provider: AIProviderName;
  model?: string;
  feature: AIFeature;
  promptHash?: string;
}

export interface PersonaAnalysisInput {
  answers: Record<string, unknown>;
}

export interface PersonaAnalysisOutput {
  persona:
    | "Planner"
    | "Procrastinator"
    | "Overachiever"
    | "Anxious Starter"
    | "General";
  confidence: number;
  traits: Record<string, unknown>;
}

export interface BreakTaskIntoSubtasksInput {
  user: any;
  task: any;
}

export interface NodeGenerationInput {
  user: any;
  task: any;
}

export interface NodeSuggestion {
  title: string;
  description?: string;
  nodeType: NodeType;
  estimatedDuration?: number;
  energyRequired?: EnergyLevel;
  temporalIntent?: TemporalIntent;
  isCompletable?: boolean;
  order?: number;
  children?: NodeSuggestion[];
}

export interface NodeExpansionInput {
  user: any;
  node: any;
  parentNode?: any;
  expansionType: 'PHASE_TO_DAILY' | 'DAILY_TO_ACTION' | 'ROOT_TO_PHASE';
}

export interface SubtaskSuggestion {
  title: string;
  description?: string;
  estimatedDuration?: number;
  energyRequired?: EnergyLevel;
}

export interface TaskEnrichmentInput {
  user: any;
  title: string;
}

export interface TaskEnrichmentOutput {
  description: string;
  priority: Priority;
  category: string;
  dueDate: string | null;
  reasoning: string;
}

export interface RefinementAnalysisInput {
  originalPlan: unknown;
  finalPlan: unknown;
}

export interface RefinementAnalysisOutput {
  patternType: "detail_oriented" | "big_picture" | "low_interruption_tolerance" | "high_autonomy";
  confidence: number;
  observation: string;
  context?: Record<string, unknown>;
}

export interface ExecutionGuidanceInput {
  user: any;
  task: any;
  subtask?: any;
}

export interface ExecutionGuidanceOutput {
  checklist: Array<{ title: string; done: boolean }>;
  timeboxMinutes?: number;
  nextActionPrompt: string;
  nudge?: string;
}

export interface JournalAssistInput {
  user: any;
  prompt: string;
}

export interface JournalAssistOutput {
  moodTags: string[];
  sentenceStarters: string[];
  promptScaffold: string;
}

export interface ReflectionSummaryInput {
  user: any;
  entries: Array<{ text: string; createdAt?: string }>;
}

export interface ReflectionSummaryOutput {
  summary: string;
  patterns: string[];
  suggestedNextSteps: string[];
}

export interface AIProvider {
  generatePersona(input: PersonaAnalysisInput, meta: AIRequestMeta): Promise<AIProviderResult<PersonaAnalysisOutput>>;

  breakTaskIntoSubtasks(
    input: BreakTaskIntoSubtasksInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<SubtaskSuggestion[]>>;

  generateNodes(
    input: NodeGenerationInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<NodeSuggestion[]>>;

  expandNode(
    input: NodeExpansionInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<NodeSuggestion[]>>;

  generateExecutionGuidance(
    input: ExecutionGuidanceInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<ExecutionGuidanceOutput>>;

  journalAssist(input: JournalAssistInput, meta: AIRequestMeta): Promise<AIProviderResult<JournalAssistOutput>>;

  reflectionSummary(
    input: ReflectionSummaryInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<ReflectionSummaryOutput>>;

  enrichTaskIntent(input: TaskEnrichmentInput, meta: AIRequestMeta): Promise<AIProviderResult<TaskEnrichmentOutput>>;

  analyzeRefinement(
    input: RefinementAnalysisInput,
    meta: AIRequestMeta
  ): Promise<AIProviderResult<RefinementAnalysisOutput>>;
}
