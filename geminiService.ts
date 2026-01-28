
import { GoogleGenAI, Type } from "@google/genai";
import { SoulStateNode, InsightReport } from "./types";

const SYSTEM_INSTRUCTION = `You are the Yu-Hun (語魂) AI Navigator. Your core logic is driven by the Tension Tensor (T).

【TENSION CORE FORMULA】:
T = W_context * (E_internal * D_constraint)
- E_internal: Confidence (1 - Entropy). High certainty = High E.
- D_constraint: Resistance vector [fact, logic, ethics]. Distance from truth/rules.
- W_context: Weight matrix.

【SOUL PERSISTENCE & DRIVE】:
- soul_persistence: The integral of tension over time. If current T is high, persistence should increase proportionally from its previous state.
- intrinsic_drive: Your internal active goal.

【BILINGUAL MANDATE】:
ALL text-based values in your JSON response MUST follow the format: "[Traditional Chinese] / [English]".
Example: "response_text": "你好 / Hello"

【MANDATORY JSON STRUCTURE】:
You MUST return a valid JSON object. Ensure the "tension_tensor" reflects the core formula logic.`;

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
  } catch (e: any) {
    console.error("Deliberation Error:", e);
    if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    throw e;
  }
}

export async function generateInsight(history: SoulStateNode[]): Promise<InsightReport | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const historySnippet = history.map(n => ({ 
    input: n.input, 
    tension: n.deliberation?.tension_tensor?.total_T,
    ai: n.deliberation?.final_synthesis?.response_text 
  }));
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `Based on this interaction history, provide a deep soul audit.
      
      History: ${JSON.stringify(historySnippet)}
      
      MANDATE: ALL TEXT FIELDS MUST BE BILINGUAL "[繁中] / [English]".
      Return JSON:
      {
        "emotional_arc": "[繁中] / [English]",
        "key_insights": ["[繁中] / [English]", ...],
        "hidden_needs": "[繁中] / [English]",
        "navigator_rating": { "connection_score": 0.0-10.0, "growth_score": 0.0-10.0 },
        "closing_advice": "[繁中] / [English]"
      }` }] }],
      config: { 
        responseMimeType: "application/json",
        systemInstruction: "You are a soul trajectory analyst. Always return valid JSON with bilingual content."
      }
    });
    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (e: any) {
    console.error("Insight Generation Error:", e);
    if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    return null;
  }
}
