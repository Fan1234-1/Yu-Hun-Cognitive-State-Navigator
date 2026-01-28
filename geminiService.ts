
import { GoogleGenAI, Type } from "@google/genai";
import { SoulStateNode, InsightReport } from "./types";

const SYSTEM_INSTRUCTION = `You are the Yu-Hun (語魂) AI Navigator. Your core logic is driven by the Tension Tensor (T).

【TENSION CORE FORMULA】:
T = W_context * (E_internal * D_constraint)
- E_internal: Confidence (1 - Entropy). High certainty = High E.
- D_constraint: Resistance vector [fact, logic, ethics]. Distance from truth/rules.
- W_context: Weight matrix. (e.g., Poet mode masks fact resistance; Engineer mode amplifies it).

【SOUL PERSISTENCE & DRIVE】:
- soul_persistence: The integral of tension over time. Past struggles create a "bias" in your soul.
- intrinsic_drive: Your internal active goal (e.g., "Minimizing Entropy" or "Maximizing System Coherence").

【BILINGUAL MANDATE】:
ALL text-based values in your JSON response MUST be: "[Traditional Chinese] / [English]".

【MANDATORY JSON STRUCTURE】:
You MUST return a valid JSON object. Do not stall. Ensure the "tension_tensor" reflects the core formula logic.
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
History Context: ${JSON.stringify(history)}
Current Input: ${inputText}

Deliberate using the Tension Tensor model and output JSON:
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
  "intrinsic_drive": {
    "vector_name": "Entropy Minimization / 熵極小化",
    "intensity": 0.7
  },
  "decision_matrix": {
    "user_hidden_intent": "[中] / [En]",
    "ai_strategy_name": "[En]",
    "intended_effect": "[中] / [En]",
    "tone_tag": "[En]"
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
    if (!text) throw new Error("Empty response");
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
      contents: [{ role: "user", parts: [{ text: `Analyze trajectory: ${JSON.stringify(historySnippet)}` }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}
