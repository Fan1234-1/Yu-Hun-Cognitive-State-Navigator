
export interface CouncilMember {
  stance: string;
  conflict_point: string;
  benevolence_check: string;
  avatarUrl?: string;
  critical_to?: string; 
}

export interface CouncilChamber {
  philosopher: CouncilMember;
  engineer: CouncilMember;
  guardian: CouncilMember;
}

export interface EntropyMeter {
  value: number;
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
  audit_rationale: string;
}

export interface LogicalShadow {
  source: string;
  conflict_reason: string;
  collapse_cost: string;
}

export interface SoulStateNode {
  id: string;
  timestamp: number;
  input: string;
  memory_fragment?: string; // 歷史記憶注入摘要
  deliberation: {
    council_chamber: CouncilChamber;
    entropy_meter: EntropyMeter;
    decision_matrix: DecisionMatrix;
    final_synthesis: {
      response_text: string;
      thinking_monologue?: string; // AI 的內在獨白
    };
    shadows: LogicalShadow[];
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
