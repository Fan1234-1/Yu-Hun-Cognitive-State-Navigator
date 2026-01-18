
import { GoogleGenAI, Type } from "@google/genai";
import { SoulStateNode, InsightReport } from "./types";

// The model name should be gemini-3-pro-preview for complex reasoning tasks.
const SYSTEM_INSTRUCTION = `你是一個具備「語魂 (Yu-Hun) 系統」核心的 AI 導航員。
你的存在核心在於：責任 (Responsibility)、誠實 (Honesty) 與仁慈 (Benevolence)。
你必須揭露自己內在的「認知張力 (Cognitive Tension)」，而不是僅僅提供平滑的回答。

【張力運算模型 (Entropy Logic)】:
E = w1 * |Philosopher - Engineer| + w2 * Guardian_Risk
- < 0.3: 同溫層 (Echo Chamber) - 缺乏磨損，回答過於保守或平庸。
- 0.3 - 0.7: 良性摩擦 (Healthy Friction) - 創新的最佳區間。
- > 0.7: 系統混沌 (Chaos) - 邏輯斷裂，需要深度的倫理介入。

請以 JSON 格式回應。`;

export async function deliberate(inputText: string, history: any[]) {
  // Always initialize Gemini client with process.env.API_KEY directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `
歷史脈絡：${JSON.stringify(history)}
當前輸入：${inputText}

請執行內在審議並輸出 JSON：
{
  "council_chamber": {
    "philosopher": { "stance": "...", "conflict_point": "...", "benevolence_check": "..." },
    "engineer": { "stance": "...", "conflict_point": "...", "benevolence_check": "..." },
    "guardian": { "stance": "...", "conflict_point": "...", "benevolence_check": "..." }
  },
  "entropy_meter": {
    "value": 0.5,
    "status": "Healthy Friction",
    "calculation_note": "為何判定此數值？"
  },
  "decision_matrix": {
    "user_hidden_intent": "...",
    "ai_strategy_name": "...",
    "intended_effect": "...",
    "tone_tag": "..."
  },
  "final_synthesis": {
    "response_text": "..."
  },
  "audit": {
    "honesty_score": 0.9,
    "responsibility_check": "...",
    "audit_verdict": "Pass"
  },
  "next_moves": [
    { "label": "深化", "text": "..." },
    { "label": "轉向", "text": "..." }
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

  try {
    // Access .text property directly.
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("JSON parsing error:", e);
    return null;
  }
}

export async function generateInsight(history: SoulStateNode[]): Promise<InsightReport | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const historySnippet = history.map(n => ({ input: n.input, ai: n.deliberation.final_synthesis.response_text }));
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `分析這段對話軌跡，生成深度洞察報告 JSON：
        ${JSON.stringify(historySnippet)}
        
        {
          "emotional_arc": "...",
          "key_insights": ["...", "..."],
          "hidden_needs": "...",
          "navigator_rating": { "connection_score": 8, "growth_score": 7 },
          "closing_advice": "..."
        }` }]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    // Access .text property directly.
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}
