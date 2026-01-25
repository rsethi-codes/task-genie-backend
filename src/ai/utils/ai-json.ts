import { createHash } from "crypto";

export function promptHash(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}

export function requireJsonObject(text: string): any {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  const candidate = (match ? match[0] : trimmed).replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(candidate);
  if (parsed == null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Expected JSON object");
  }
  return parsed;
}

export function requireJsonArray(text: string): any[] {
  const trimmed = text.trim();
  const match = trimmed.match(/\[[\s\S]*\]/);
  const candidate = (match ? match[0] : trimmed).replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(candidate);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array");
  }
  return parsed;
}
