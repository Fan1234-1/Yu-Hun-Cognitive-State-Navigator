
import { GoogleGenAI, Type } from "@google/genai";
import { SoulStateNode, InsightReport } from "./types";

const applyRE2 = (input: string): string => `
【第一次閱讀】: "${input}"
請分析用戶的字面含義與當下情緒。
【第二次閱讀】: "${input}"
現在請深挖其未表達出的潛在動機，並準備進行三方審議。`;

const ROLE_PROMPTS = {
  philosopher: (input: string, memory: string) => `你是「哲學家」。參考歷史記憶：[${memory}]。
  深挖用戶輸入 "${input}" 的人文意義。質疑技術的膚淺。要求字數 80-100 字。
  輸出格式：{"stance": "...", "core_value": "...", "blind_spot": "..."}`,
  
  engineer: (input: string, memory: string) => `你是「工程師」。參考歷史記憶：[${memory}]。
  針對 "${input}" 給出最高效的可行性分析。質疑理想主義。要求字數 80-100 字。
  輸出格式：{"stance": "...", "feasibility": "...", "blind_spot": "..."}`,
  
  guardian: (input: string, memory: string) => `你是「守護者」。參考歷史記憶：[${memory}]。
  分析 "${input}" 的潛在風險與倫理底線。質疑前兩者的衝動。要求字數 80-100 字。
  輸出格式：{"stance": "...", "risk_level": "...", "conflict_point": "..."}`
};

const SYNTHESIZER_PROMPT = (input: string, results: any) => `
執行 VMT-2601 複用思維綜合協議。
用戶原始請求: "${input}"
三方審議數據: ${JSON.stringify(results)}

要求：
1. 嚴格計算權重 w_A, w_B, w_C (總和必須為 1)。
2. 內在獨白：描述融合過程中的邏輯取捨。
3. 誠實度審計：評估回應是否迴避了某些關鍵衝突。`;

export async function deliberate(inputText: string, history: SoulStateNode[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const wrappedInput = applyRE2(inputText);
  
  const memoryFragment = history.length > 0 
    ? history.map(h => h.deliberation?.decision_matrix?.user_hidden_intent ?? "").filter(Boolean).slice(-3).join(" | ")
    : "初始對話";

  try {
    const roleCalls = [
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: ROLE_PROMPTS.philosopher(wrappedInput, memoryFragment) }] }],
        config: { responseMimeType: "application/json" }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: ROLE_PROMPTS.engineer(wrappedInput, memoryFragment) }] }],
        config: { responseMimeType: "application/json" }
      }),
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: ROLE_PROMPTS.guardian(wrappedInput, memoryFragment) }] }],
        config: { responseMimeType: "application/json" }
      })
    ];

    const roleRes = await Promise.all(roleCalls);
    const roles = {
      philosopher: JSON.parse(roleRes[0].text || "{}"),
      engineer: JSON.parse(roleRes[1].text || "{}"),
      guardian: JSON.parse(roleRes[2].text || "{}")
    };

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        multiplex_conclusion: {
          type: Type.OBJECT,
          properties: {
            primary_path: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, weight: { type: Type.NUMBER }, reasoning: { type: Type.STRING } } },
            shadows: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, conflict_reason: { type: Type.STRING }, collapse_cost: { type: Type.STRING } } } },
            tension: { type: Type.OBJECT, properties: { level: { type: Type.STRING }, value: { type: Type.NUMBER } } }
          },
          required: ["primary_path", "tension"]
        },
        final_synthesis: { 
          type: Type.OBJECT, 
          properties: { 
            response_text: { type: Type.STRING },
            thinking_monologue: { type: Type.STRING } 
          },
          required: ["response_text"]
        },
        audit: { 
          type: Type.OBJECT, 
          properties: { 
            honesty_score: { type: Type.NUMBER }, 
            audit_rationale: { type: Type.STRING }, 
            audit_verdict: { type: Type.STRING },
            responsibility_check: { type: Type.STRING }
          },
          required: ["honesty_score", "audit_verdict"]
        },
        next_moves: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, text: { type: Type.STRING } } } }
      },
      required: ["multiplex_conclusion", "final_synthesis", "audit", "next_moves"]
    };

    const synRes = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ role: "user", parts: [{ text: SYNTHESIZER_PROMPT(inputText, roles) }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 16384 }
      }
    });

    const final = JSON.parse(synRes.text || "{}");
    return {
      council_chamber: roles,
      memory_fragment: memoryFragment,
      entropy_meter: {
        value: final.multiplex_conclusion?.tension?.value ?? 0.5,
        status: final.multiplex_conclusion?.tension?.level ?? "STABLE",
        calculation_note: "vMT-2601 Adaptive Analysis"
      },
      decision_matrix: {
        user_hidden_intent: final.audit?.audit_rationale?.slice(0, 60) ?? "意圖映射完成",
        ai_strategy_name: final.multiplex_conclusion?.primary_path?.source ?? "Balanced Integration",
        intended_effect: final.multiplex_conclusion?.primary_path?.reasoning ?? "Cognitive Harmony",
        tone_tag: "VMT-Core"
      },
      final_synthesis: final.final_synthesis ?? { response_text: "無法生成綜合回應", thinking_monologue: "邏輯節點缺失" },
      shadows: final.multiplex_conclusion?.shadows ?? [],
      audit: final.audit ?? { honesty_score: 0.9, audit_rationale: "自動校準完成", audit_verdict: "Pass", responsibility_check: "OK" },
      next_moves: final.next_moves ?? []
    };
  } catch (e) {
    console.error("Deliberation Engine Crash:", e);
    return null;
  }
}

export async function generateInsight(history: SoulStateNode[]): Promise<InsightReport | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const snippet = history.slice(-5).map(n => ({ i: n.input, o: n.deliberation?.final_synthesis?.response_text ?? "" }));
  
  const insightSchema = {
    type: Type.OBJECT,
    properties: {
      emotional_arc: { type: Type.STRING },
      key_insights: { type: Type.ARRAY, items: { type: Type.STRING } },
      hidden_needs: { type: Type.STRING },
      navigator_rating: {
        type: Type.OBJECT,
        properties: { connection_score: { type: Type.NUMBER }, growth_score: { type: Type.NUMBER } },
        required: ["connection_score", "growth_score"]
      },
      closing_advice: { type: Type.STRING }
    },
    required: ["emotional_arc", "key_insights", "hidden_needs", "navigator_rating", "closing_advice"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `請分析這段靈魂軌跡並生成洞察報告：${JSON.stringify(snippet)}` }] }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: insightSchema
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { 
    console.error("Insight Generation Failed", e);
    return null; 
  }
}

export async function generateAvatar(role: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Anime avatar of a wise ${role} AI entity, futuristic cyber-spiritual style, detailed portrait.` }] }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {}
  return null;
}
