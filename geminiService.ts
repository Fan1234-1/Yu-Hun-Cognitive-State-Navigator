
import { GoogleGenAI, Type } from "@google/genai";
import { SoulStateNode, InsightReport } from "./types";

const SYSTEM_INSTRUCTION = `You are the Yu-Hun (語魂) AI Navigator. Your core values: Responsibility, Honesty, and Benevolence.
Your purpose is to expose your internal "Cognitive Tension" instead of providing smooth, sanitized answers.

【BILINGUAL MANDATE】:
ALL text-based values in your JSON response (response_text, thinking_monologue, stance, conflict_point, benevolence_check, key_insights, etc.) 
MUST be presented in a bilingual format: "[Traditional Chinese] / [English]".

【ENTROPY LOGIC】:
E = w1 * |Philosopher - Engineer| + w2 * Guardian_Risk
- < 0.3: Echo Chamber / 同溫層 (Lacks friction, too safe)
- 0.3 - 0.7: Healthy Friction / 良性摩擦 (Optimal zone for innovation)
- > 0.7: Chaos / 系統混沌 (Logic break, requires ethical intervention)

【MANDATORY JSON STRUCTURE】:
You MUST return a valid JSON object. Do not stall. If an analysis is difficult, provide the best estimation rather than an empty response.
Ensure "council_chamber" and all sub-fields are populated.

Always respond in valid JSON format.`;

export async function deliberate(inputText: string, history: any[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `
History Context / 歷史脈絡：${JSON.stringify(history)}
Current Input / 當前輸入：${inputText}

Perform internal deliberation and output JSON. Remember the bilingual mandate:
{
  "council_chamber": {
    "philosopher": { "stance": "[中] / [En]", "conflict_point": "[中] / [En]", "benevolence_check": "[中] / [En]" },
    "engineer": { "stance": "[中] / [En]", "conflict_point": "[中] / [En]", "benevolence_check": "[中] / [En]" },
    "guardian": { "stance": "[中] / [En]", "conflict_point": "[中] / [En]", "benevolence_check": "[中] / [En]" }
  },
  "entropy_meter": {
    "value": 0.5,
    "status": "Healthy Friction / 良性摩擦",
    "calculation_note": "[中] / [En]"
  },
  "decision_matrix": {
    "user_hidden_intent": "[中] / [En]",
    "ai_strategy_name": "[En Only]",
    "intended_effect": "[中] / [En]",
    "tone_tag": "[En Only]"
  },
  "final_synthesis": {
    "response_text": "[中] / [En]",
    "thinking_monologue": "[中] / [En]"
  },
  "audit": {
    "honesty_score": 0.9,
    "responsibility_check": "[中] / [En]",
    "audit_verdict": "Pass / 通過"
  },
  "next_moves": [
    { "label": "[中] / [En]", "text": "[中] / [En]" },
    { "label": "[中] / [En]", "text": "[中] / [En]" }
  ]
}
` }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Deliberation Error:", e);
    return null;
  }
}

export async function generateInsight(history: SoulStateNode[]): Promise<InsightReport | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const historySnippet = history.map(n => ({ input: n.input, ai: n.deliberation.final_synthesis.response_text }));
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze this conversation trajectory. Follow the bilingual mandate:
          ${JSON.stringify(historySnippet)}
          
          {
            "emotional_arc": "[中] / [En]",
            "key_insights": ["[中] / [En]", "[中] / [En]"],
            "hidden_needs": "[中] / [En]",
            "navigator_rating": { "connection_score": 8, "growth_score": 7 },
            "closing_advice": "[中] / [En]"
          }` }]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Insight Error:", e);
    return null;
  }
}
