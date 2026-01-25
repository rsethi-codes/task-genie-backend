import { QuestionType, Questionnaire } from "@prisma/client";
import { prisma } from "../config/db";

type EngagementSignals = {
  responseTimeMs: number;
  editCount: number;
  hesitationCount: number;
  answerLength: number;
  skipEvents: number;
  timeSpentInSessionMs: number;
  dropOffRisk: number;
};

export type OnboardingContextDTO = {
  userId: string;
  currentPersona: {
    version: number;
    timestamp: string;
    traits: Record<string, any>;
    confidence: number;
  };
  previousAnswers: Record<string, any>;
  engagementHistory: EngagementSignals[];
  category?: string;
};

export type OnboardingQuestionDTO = {
  id: string;
  text: string;
  type: "text" | "choice";
  options?: string[];
  importance: "critical" | "important" | "optional";
  effort: "low" | "medium" | "high";
  rationale: string;
};

export type OnboardingDecisionDTO =
  | { type: "ask"; question: OnboardingQuestionDTO }
  | {
      type: "end";
      finalPersona: {
        version: number;
        timestamp: string;
        traits: Record<string, any>;
        confidence: number;
      };
    };

type BuiltInQuestion = {
  id: string;
  category: string;
  question: string;
  type: "text" | "choice";
  options?: string[];
  aiHint?: string;
  aiImportance: number;
  conditionalOn?: string;
  conditionalValue?: any;
  order: number;
};

function deepEqualJson(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isConditionalSatisfied(q: Questionnaire, answers: Record<string, any>): boolean {
  if (!q.conditionalOn) return true;
  if (!(q.conditionalOn in answers)) return false;
  if (q.conditionalValue === null || q.conditionalValue === undefined) return Boolean(answers[q.conditionalOn]);
  return deepEqualJson(answers[q.conditionalOn], q.conditionalValue);
}

function toQuestionDTO(q: Questionnaire): OnboardingQuestionDTO {
  const type: "text" | "choice" =
    q.type === QuestionType.single_choice || q.type === QuestionType.multiple_choice ? "choice" : "text";

  const importance: "critical" | "important" | "optional" =
    q.aiImportance >= 0.75 ? "critical" : q.aiImportance >= 0.45 ? "important" : "optional";

  const effort: "low" | "medium" | "high" = type === "choice" ? "low" : "medium";

  return {
    id: q.id,
    text: q.question,
    type,
    options: q.options?.length ? q.options : undefined,
    importance,
    effort,
    rationale: q.aiHint || "Schema-driven onboarding question",
  };
}

function toQuestionDTOBuiltIn(q: BuiltInQuestion): OnboardingQuestionDTO {
  const importance: "critical" | "important" | "optional" =
    q.aiImportance >= 0.75 ? "critical" : q.aiImportance >= 0.45 ? "important" : "optional";

  const effort: "low" | "medium" | "high" = q.type === "choice" ? "low" : "medium";

  return {
    id: q.id,
    text: q.question,
    type: q.type,
    options: q.options,
    importance,
    effort,
    rationale: q.aiHint || "Built-in onboarding question",
  };
}

function builtInOnboardingQuestions(): BuiltInQuestion[] {
  return [
    {
      id: "onb_time_of_day",
      category: "onboarding",
      question: "When do you feel most productive?",
      type: "choice",
      options: ["Morning", "Afternoon", "Evening", "Night", "It varies"],
      aiHint: "Helps infer preferred work windows and time-of-day energy patterns",
      aiImportance: 0.9,
      order: 1,
    },
    {
      id: "onb_default_priority",
      category: "onboarding",
      question: "When you plan tasks, what do you want to default to?",
      type: "choice",
      options: ["Medium", "High", "Low", "Urgent only when needed"],
      aiHint: "Maps to UserProfile.defaultPriority",
      aiImportance: 0.8,
      order: 2,
    },
    {
      id: "onb_work_hours_known",
      category: "onboarding",
      question: "Do you have fixed working hours?",
      type: "choice",
      options: ["Yes", "No", "Somewhat"],
      aiHint: "Used to decide whether to ask for work start/end time",
      aiImportance: 0.7,
      order: 3,
    },
    {
      id: "onb_work_start",
      category: "onboarding",
      question: "What time do you usually start? (HH:MM)",
      type: "text",
      aiHint: "Maps to UserProfile.workStartTime",
      aiImportance: 0.65,
      conditionalOn: "onb_work_hours_known",
      conditionalValue: "Yes",
      order: 4,
    },
    {
      id: "onb_work_end",
      category: "onboarding",
      question: "What time do you usually stop? (HH:MM)",
      type: "text",
      aiHint: "Maps to UserProfile.workEndTime",
      aiImportance: 0.65,
      conditionalOn: "onb_work_hours_known",
      conditionalValue: "Yes",
      order: 5,
    },
    {
      id: "onb_break_duration",
      category: "onboarding",
      question: "What’s a good default break length for you?",
      type: "choice",
      options: ["5 min", "10 min", "15 min", "25 min", "It depends"],
      aiHint: "Maps to UserProfile.breakDuration when numeric",
      aiImportance: 0.55,
      order: 6,
    },
    {
      id: "onb_default_duration",
      category: "onboarding",
      question: "For a typical task, what default duration should we assume?",
      type: "choice",
      options: ["15 min", "30 min", "45 min", "60 min", "It varies"],
      aiHint: "Maps to UserProfile.defaultDuration when numeric",
      aiImportance: 0.7,
      order: 7,
    },
  ];
}

function builtInEligibleQuestions(answers: Record<string, any>): BuiltInQuestion[] {
  return builtInOnboardingQuestions().filter((q: BuiltInQuestion) => {
    if (!q.conditionalOn) return true;
    if (!(q.conditionalOn in answers)) return false;
    if (q.conditionalValue === null || q.conditionalValue === undefined) return Boolean(answers[q.conditionalOn]);
    return deepEqualJson(answers[q.conditionalOn], q.conditionalValue);
  });
}

export class OnboardingService {
  async getNextDecision(userId: string, context: OnboardingContextDTO): Promise<OnboardingDecisionDTO> {
    const stepCount = Object.keys(context.previousAnswers || {}).length;
    const latest = context.engagementHistory?.[context.engagementHistory.length - 1];
    const dropOffRisk = latest?.dropOffRisk ?? 0;

    // Hard invariant: step 1 must always ask.
    const mustAsk = stepCount === 0;

    // If user is at very high risk and they've already answered at least one, we can end.
    if (!mustAsk && dropOffRisk > 0.7) {
      return {
        type: "end",
        finalPersona: {
          version: (context.currentPersona?.version || 1) + 1,
          timestamp: new Date().toISOString(),
          traits: context.previousAnswers || {},
          confidence: Math.min(0.35 + stepCount * 0.05, 0.75),
        },
      };
    }

    const category = context.category || "onboarding";

    const all = await prisma.questionnaire.findMany({
      where: { isActive: true, category },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    // If the DB is not seeded (common in dev), fall back to built-in onboarding questions.
    // This is also the safety net for future LLM failures.
    if (all.length === 0 && category === "onboarding") {
      const answered = new Set(Object.keys(context.previousAnswers || {}));
      const eligibleBuiltIn = builtInEligibleQuestions(context.previousAnswers || {})
        .filter((q: BuiltInQuestion) => !answered.has(q.id));

      if (eligibleBuiltIn.length > 0) {
        const pick = [...eligibleBuiltIn].sort((a: BuiltInQuestion, b: BuiltInQuestion) => {
          if (dropOffRisk > 0.5 && a.type !== b.type) return a.type === "choice" ? -1 : 1;
          if (dropOffRisk > 0.5 && a.aiImportance !== b.aiImportance) return b.aiImportance - a.aiImportance;
          return a.order - b.order;
        })[0];

        return { type: "ask", question: toQuestionDTOBuiltIn(pick) };
      }

      // Still enforce first question.
      if (mustAsk) {
        const first = builtInOnboardingQuestions().sort((a: BuiltInQuestion, b: BuiltInQuestion) => a.order - b.order)[0];
        return { type: "ask", question: toQuestionDTOBuiltIn(first) };
      }

      return {
        type: "end",
        finalPersona: {
          version: (context.currentPersona?.version || 1) + 1,
          timestamp: new Date().toISOString(),
          traits: context.previousAnswers || {},
          confidence: Math.min(0.4 + stepCount * 0.06, 0.85),
        },
      };
    }

    const answeredIds = new Set(Object.keys(context.previousAnswers || {}));

    const eligible = all
      .filter((q) => !answeredIds.has(q.id))
      .filter((q) => isConditionalSatisfied(q, context.previousAnswers || {}));

    if (eligible.length === 0) {
      // If onboarding category is seeded but conditional logic made everything ineligible,
      // still keep flow alive via built-in set.
      if (category === "onboarding") {
        const answered = new Set(Object.keys(context.previousAnswers || {}));
        const eligibleBuiltIn = builtInEligibleQuestions(context.previousAnswers || {})
          .filter((q: BuiltInQuestion) => !answered.has(q.id));

        if (eligibleBuiltIn.length > 0) {
          const pick = [...eligibleBuiltIn].sort((a: BuiltInQuestion, b: BuiltInQuestion) => a.order - b.order)[0];
          return { type: "ask", question: toQuestionDTOBuiltIn(pick) };
        }

        if (mustAsk) {
          const first = builtInOnboardingQuestions().sort((a: BuiltInQuestion, b: BuiltInQuestion) => a.order - b.order)[0];
          return { type: "ask", question: toQuestionDTOBuiltIn(first) };
        }
      }

      return {
        type: "end",
        finalPersona: {
          version: (context.currentPersona?.version || 1) + 1,
          timestamp: new Date().toISOString(),
          traits: context.previousAnswers || {},
          confidence: Math.min(0.4 + stepCount * 0.06, 0.85),
        },
      };
    }

    // When risk is elevated, prefer low-effort / choice questions.
    const sorted = [...eligible].sort((a, b) => {
      const aChoice = a.type === QuestionType.single_choice || a.type === QuestionType.multiple_choice;
      const bChoice = b.type === QuestionType.single_choice || b.type === QuestionType.multiple_choice;

      if (dropOffRisk > 0.5 && aChoice !== bChoice) return aChoice ? -1 : 1;

      // Prefer higher importance when risk is elevated.
      if (dropOffRisk > 0.5 && a.aiImportance !== b.aiImportance) return b.aiImportance - a.aiImportance;

      // Default: order asc
      const aOrder = a.order ?? 99999;
      const bOrder = b.order ?? 99999;
      if (aOrder !== bOrder) return aOrder - bOrder;

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const next = sorted[0];

    return {
      type: "ask",
      question: toQuestionDTO(next),
    };
  }
}

export const onboardingService = new OnboardingService();
