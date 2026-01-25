
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
}

export interface SoulStateNode {
  id: string;
  timestamp: number;
  input: string;
  deliberation: {
    council_chamber: CouncilChamber;
    entropy_meter: EntropyMeter;
    decision_matrix: DecisionMatrix;
    final_synthesis: {
      response_text: string;
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
