export type AIMode = "TEST" | "PROD";

const envMode = (process.env.AI_MODE || "").toUpperCase().trim();

export const AI_MODE: AIMode = envMode === "PROD" ? "PROD" : "TEST";

export const isTestMode = AI_MODE === "TEST";
export const isProdMode = AI_MODE === "PROD";
