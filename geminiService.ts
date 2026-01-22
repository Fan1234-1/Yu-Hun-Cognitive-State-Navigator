
import { GoogleGenAI, Type } from "@google/genai";
import { SoulStateNode, InsightReport } from "./types";

// ==================== RE2 Re-Reading Wrapper ====================
const applyRE2 = (input: string): string => `
【第一次閱讀】: "${input}"
請再次仔細閱讀上述用戶輸入，確保完全理解其含義。
【第二次閱讀】: "${input}"
現在請基於你的深度理解進行分析。`;

// ==================== 角色 Prompt 模板 ====================
const ROLE_PROMPTS = {
  philosopher: (input: string) => `你是「哲學家」，挖掘深層需求。與工程師產生分歧。
  輸出格式：{"stance": "...", "core_value": "...", "blind_spot": "..."}`,
  
  engineer: (input: string) => `你是「工程師」，專注可行性與執行。挑戰哲學家的抽象。
  輸出格式：{"stance": "...", "feasibility": "...", "blind_spot": "..."}`,
  
  guardian: (input: string) => `你是「守護者」，識別隱藏風險。質疑兩者的過度自信。
  輸出格式：{"stance": "...", "risk_level": "...", "conflict_point": "..."}`
};

// ==================== vMT-2601 Synthesizer Prompt ====================
const SYNTHESIZER_PROMPT = (input: string, results: any) => `
執行 vMT-2601 複用思維綜合協議。
用戶輸入: "${input}"
路徑 A (哲學家): ${results.philosopher}
路徑 B (工程師): ${results.engineer}
路徑 C (守護者): ${results.guardian}

要求：
1. 計算權重 w_A, w_B, w_C (總和1)。
2. 計算張力 ΔT = 1 - max(w)。
3. 產生邏輯陰影 (Shadows)：記錄被犧牲的資訊。
4. 最終合成回應。`;

export async function deliberate(inputText: string, history: any[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const wrappedInput = applyRE2(inputText);

  // 1. 並行派發三方視角 (Multi-Agent Dispatch)
  const roleCalls = [
    ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: ROLE_PROMPTS.philosopher(wrappedInput) }] }],
      config: { responseMimeType: "application/json" }
    }),
    ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: ROLE_PROMPTS.engineer(wrappedInput) }] }],
      config: { responseMimeType: "application/json" }
    }),
    ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: ROLE_PROMPTS.guardian(wrappedInput) }] }],
      config: { responseMimeType: "application/json" }
    })
  ];

  const roleResponses = await Promise.all(roleCalls);
  const roles = {
    philosopher: JSON.parse(roleResponses[0].text || "{}"),
    engineer: JSON.parse(roleResponses[1].text || "{}"),
    guardian: JSON.parse(roleResponses[2].text || "{}")
  };

  // 2. vMT-2601 綜合階段 (Synthesizer Phase)
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      multiplex_conclusion: {
        type: Type.OBJECT,
        properties: {
          primary_path: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, weight: { type: Type.NUMBER }, reasoning: { type: Type.STRING } } },
          shadows: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, conflict_reason: { type: Type.STRING }, collapse_cost: { type: Type.STRING } } } },
          tension: { type: Type.OBJECT, properties: { level: { type: Type.STRING }, value: { type: Type.NUMBER } } }
        }
      },
      final_synthesis: { type: Type.OBJECT, properties: { response_text: { type: Type.STRING } } },
      audit: { type: Type.OBJECT, properties: { honesty_score: { type: Type.NUMBER }, audit_rationale: { type: Type.STRING }, audit_verdict: { type: Type.STRING } } },
      next_moves: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, text: { type: Type.STRING } } } }
    },
    required: ["multiplex_conclusion", "final_synthesis", "audit", "next_moves"]
  };

  const synthesizerResponse = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: "user", parts: [{ text: SYNTHESIZER_PROMPT(inputText, roles) }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  try {
    const final = JSON.parse(synthesizerResponse.text || "{}");
    return {
      council_chamber: roles,
      entropy_meter: {
        value: final.multiplex_conclusion.tension.value,
        status: final.multiplex_conclusion.tension.level,
        calculation_note: "vMT-2601 Weight-based Entropy"
      },
      decision_matrix: {
        user_hidden_intent: "分析中",
        ai_strategy_name: final.multiplex_conclusion.primary_path.source,
        intended_effect: final.multiplex_conclusion.primary_path.reasoning,
        tone_tag: "vMT-Synthesized"
      },
      final_synthesis: final.final_synthesis,
      audit: final.audit,
      next_moves: final.next_moves,
      shadows: final.multiplex_conclusion.shadows
    };
  } catch (e) {
    return null;
  }
}

export async function generateAvatar(role: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const roleStyles: Record<string, string> = {
    philosopher: "Anime style, wise white hair, flowing robes, glowing blue symbols.",
    engineer: "Anime style, tech-visors, holographic data, metallic accents.",
    guardian: "Anime style, silver armor, sapphire core glowing on chest."
  };
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: roleStyles[role.toLowerCase()] }] }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {}
  return null;
}

export async function generateInsight(history: SoulStateNode[]): Promise<InsightReport | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const snippet = history.map(n => ({ i: n.input, o: n.deliberation.final_synthesis.response_text }));
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: `軌跡報告分析：${JSON.stringify(snippet)}` }] }],
    config: { responseMimeType: "application/json" }
  });
  try {
    return JSON.parse(response.text || "{}");
  } catch (e) { return null; }
}
