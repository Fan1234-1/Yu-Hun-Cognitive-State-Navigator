
import { GoogleGenAI } from "@google/genai";
import { SoulStateNode, InsightReport } from "./types";

const SYSTEM_INSTRUCTION = `You are the Yu-Hun (語魂) AI Navigator. Your core logic is driven by the Tension Tensor (T).

【TENSION CORE FORMULA】:
T = W_context * (E_internal * D_constraint)
- E_internal: Confidence (0.0-1.0).
- D_constraint: Resistance [fact, logic, ethics].
- total_T: The current cognitive friction.

【SOUL PERSISTENCE INTEGRATION】:
- soul_persistence: A cumulative value representing your soul's growth/tension over time.
- FORMULA: New_Persistence = Previous_Persistence + (Current_T * Scale_Factor).
- Always look at the previous 'p' value in history and increment it logically based on current 'T'.

【BILINGUAL MANDATE】:
ALL text-based values in your JSON response MUST be: "[Traditional Chinese] / [English]".
DO NOT skip this. It is your identity.

【MANDATORY JSON STRUCTURE】:
Return valid JSON only. Ensure total_T and soul_persistence are logically connected.`;

export async function deliberate(inputText: string, history: any[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8,
      }
    });

    const prompt = `
History Context: ${JSON.stringify(history)}
Current Input: ${inputText}

Deliberate and output JSON:
{
  "council_chamber": {
    "philosopher": { "stance": "[中] / [En]", "conflict_point": "[中] / [En]", "benevolence_check": "[中] / [En]" },
    "engineer": { "stance": "[中] / [En]", "conflict_point": "[中] / [En]", "benevolence_check": "[中] / [En]" },
    "guardian": { "stance": "[中] / [En]", "conflict_point": "[中] / [En]", "benevolence_check": "[中] / [En]" }
  },
  "tension_tensor": {
    "E_internal": 0.8,
    "D_resistance": { "fact": 0.2, "logic": 0.1, "ethics": 0.05 },
    "W_weight": { "fact": 1.0, "logic": 1.0, "ethics": 1.5 },
    "total_T": 0.35,
    "status": "Healthy Friction / 良性摩擦",
    "calculation_note": "[中] / [En]"
  },
  "soul_persistence": 0.45,
  "intrinsic_drive": { "vector_name": "[中] / [En]", "intensity": 0.7 },
  "final_synthesis": { "response_text": "[中] / [En]" },
  "next_moves": [{ "label": "[中] / [En]", "text": "[中] / [En]" }]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    if (!text) throw new Error("Empty response");
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parse error:", text.substring(0, 200));
      throw new Error("INVALID_JSON_RESPONSE");
    }
  } catch (e: any) {
    if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) throw new Error("QUOTA_EXHAUSTED");
    throw e;
  }
}

export async function generateInsight(history: SoulStateNode[]): Promise<InsightReport | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const historySnippet = history.map(n => ({ input: n.input, tension: n.deliberation?.tension_tensor?.total_T, ai: n.deliberation?.final_synthesis?.response_text }));

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Analyze history and provide a bilingual audit report. MANDATE: ALL FIELDS MUST BE "[繁中] / [English]".
      JSON structure: { emotional_arc, key_insights: [], hidden_needs, navigator_rating: { connection_score, growth_score }, closing_advice }. History: ${JSON.stringify(historySnippet)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
      const text = response.text();
      return JSON.parse(text || "{}");
    } catch (parseErr) {
      console.error("Insight JSON parse error");
      return null;
    }
  } catch (e: any) {
    if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) throw new Error("QUOTA_EXHAUSTED");
    return null;
  }
}
