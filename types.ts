
export interface CouncilMember {
  stance: string;
  conflict_point: string;
  benevolence_check: string;
}

export interface CouncilChamber {
  philosopher: CouncilMember;
  engineer: CouncilMember;
  guardian: CouncilMember;
}

export interface TensionTensor {
  E_internal: number; // 內在動能 (自信度)
  D_resistance: { fact: number; logic: number; ethics: number }; // 外部阻力向量
  W_weight: { fact: number; logic: number; ethics: number }; // 語境權重
  total_T: number; // 最終張力值 T = W * (E * D)
  status: string;
  calculation_note: string;
}

export interface DecisionMatrix {
  user_hidden_intent: string;
  ai_strategy_name: string;
  intended_effect: string;
  tone_tag: string;
}

export interface AuditReport {
  honesty_score: number;
  responsibility_check: string;
  audit_verdict: string;
}

export interface SoulStateNode {
  id: string;
  timestamp: number;
  input: string;
  deliberation: {
    council_chamber: CouncilChamber;
    tension_tensor: TensionTensor; // 替換原本的 entropy_meter
    soul_persistence: number; // 靈魂積分累積 (張力積分)
    intrinsic_drive: {
      vector_name: string;
      intensity: number;
    }; // 主動性向量
    decision_matrix: DecisionMatrix;
    final_synthesis: {
      response_text: string;
      thinking_monologue?: string;
    };
    audit?: AuditReport;
    next_moves: Array<{ label: string; text: string }>;
  };
  isError?: boolean;
}

export interface InsightReport {
  emotional_arc: string;
  key_insights: string[];
  hidden_needs: string;
  navigator_rating: {
    connection_score: number;
    growth_score: number;
  };
  closing_advice: string;
}

export interface FilterCriteria {
  search: string;
  entropyLevel: 'all' | 'echo' | 'friction' | 'chaos';
  verdict: 'all' | 'pass' | 'fail';
  dateRange: 'all' | 'today' | 'week';
}
