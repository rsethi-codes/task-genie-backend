import { AI_MODE } from "../config/ai-config.js";
import type { AIProvider, AIFeature, AIRequestMeta } from "./ai-provider.js";
import { TestAIProvider } from "./providers/test-ai-provider.js";
import { GeminiAIProvider } from "./providers/gemini-ai-provider.js";
import { GroqAIProvider } from "./providers/groq-ai-provider.js";

const ruleProvider = new TestAIProvider();
const geminiProvider = new GeminiAIProvider();
let groqProvider: GroqAIProvider | null = null;

function shouldLog() {
  return process.env.NODE_ENV !== "production";
}

export function logAI(meta: AIRequestMeta, providerName: string) {
  if (!shouldLog()) return;
  console.log(`[AI] Mode: ${AI_MODE} | Provider: ${providerName} | Feature: ${meta.feature}`);
}

export function getAIProvider(): AIProvider {
  if (AI_MODE === "PROD") return geminiProvider;

  if (AI_MODE === "TEST") {
    const freeProvider = (process.env.FREE_LLM_PROVIDER || "").toLowerCase().trim();
    if (freeProvider === "groq") {
      try {
        if (!groqProvider) groqProvider = new GroqAIProvider();
        return groqProvider;
      } catch {
        return ruleProvider;
      }
    }
    return ruleProvider;
  }

  return ruleProvider;
}

function providerLabel(provider: AIProvider): string {
  if (AI_MODE === "PROD") return "GeminiAIProvider";
  if (provider instanceof GroqAIProvider) return "Groq";
  return "TestAIProvider";
}

export async function runWithAIFallback<T>(
  meta: AIRequestMeta,
  run: (provider: AIProvider) => Promise<T>
): Promise<{ providerUsed: string; result: T }> {
  const provider = getAIProvider();
  const providerName = providerLabel(provider);
  logAI(meta, providerName);

  try {
    return { providerUsed: providerName, result: await run(provider) };
  } catch (error) {
    if (AI_MODE === "TEST" && providerName === "Groq") {
      console.warn("[AI] Groq failed → falling back to RuleAIProvider");
    }
    logAI(meta, "TestAIProvider");
    return { providerUsed: "TestAIProvider", result: await run(ruleProvider) };
  }
}

export const FeatureMapping: Record<AIFeature, { test: string; prod: string }> = {
  PersonaAnalysis: { test: "Rules + heuristics", prod: "Gemini" },
  SubtaskGeneration: { test: "Templates", prod: "Gemini" },
  ExecutionGuidance: { test: "Checklists", prod: "Gemini" },
  Journaling: { test: "Scaffolds", prod: "Gemini" },
  Reflection: { test: "Templates", prod: "Gemini" },
  TaskEnrichment: { test: "Rules + heuristics", prod: "Gemini" },
  RefinementAnalysis: { test: "Heuristics", prod: "Gemini" },
  NodeGeneration: { test: "Heuristics", prod: "Gemini 2.0" },
  NodeExpansion: { test: "Heuristics", prod: "Gemini 2.0" },
};
