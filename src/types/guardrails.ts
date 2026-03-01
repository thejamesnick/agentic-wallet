export interface SpendingLimits {
  perTransaction: {
    amount: number;
    currency: 'SOL' | 'USD';
  };
  perHour: {
    amount: number;
    currency: 'SOL' | 'USD';
  };
  perDay: {
    amount: number;
    currency: 'SOL' | 'USD';
  };
  requireApprovalAbove: {
    amount: number;
    currency: 'SOL' | 'USD';
  };
  reserveSolForGas: number; // Always keep this much SOL
}

export interface TransactionRecord {
  timestamp: number;
  amount: number;
  currency: 'SOL' | 'USD';
  type: 'buy' | 'sell' | 'swap' | 'send';
  approved: boolean;
}

export interface GuardrailsConfig {
  enabled: boolean;
  limits: SpendingLimits;
  transactions: TransactionRecord[];
}

// Risk profiles for different use cases
export const RISK_PROFILES = {
  micro: {
    perTransaction: { amount: 0.1, currency: 'SOL' as const }, // ~$14
    perHour: { amount: 0.5, currency: 'SOL' as const },         // ~$70
    perDay: { amount: 2.0, currency: 'SOL' as const },          // ~$280
    requireApprovalAbove: { amount: 0.05, currency: 'SOL' as const }, // ~$7
    reserveSolForGas: 0.001, // ~$0.14 (enough for ~200 transactions)
  },
  conservative: {
    perTransaction: { amount: 0.5, currency: 'SOL' as const }, // ~$70
    perHour: { amount: 2.0, currency: 'SOL' as const },         // ~$280
    perDay: { amount: 10.0, currency: 'SOL' as const },         // ~$1,400
    requireApprovalAbove: { amount: 0.3, currency: 'SOL' as const }, // ~$42
    reserveSolForGas: 0.001, // ~$0.14 (enough for ~200 transactions)
  },
  moderate: {
    perTransaction: { amount: 2.0, currency: 'SOL' as const }, // ~$280
    perHour: { amount: 10.0, currency: 'SOL' as const },        // ~$1,400
    perDay: { amount: 50.0, currency: 'SOL' as const },         // ~$7,000
    requireApprovalAbove: { amount: 1.0, currency: 'SOL' as const }, // ~$140
    reserveSolForGas: 0.001, // ~$0.14 (enough for ~200 transactions)
  },
  degen: {
    perTransaction: { amount: 10.0, currency: 'SOL' as const }, // ~$1,400
    perHour: { amount: 50.0, currency: 'SOL' as const },         // ~$7,000
    perDay: { amount: 200.0, currency: 'SOL' as const },         // ~$28,000
    requireApprovalAbove: { amount: 5.0, currency: 'SOL' as const }, // ~$700
    reserveSolForGas: 0.001, // ~$0.14 (enough for ~200 transactions)
  },
  whale: {
    perTransaction: { amount: 100.0, currency: 'SOL' as const }, // ~$14,000
    perHour: { amount: 500.0, currency: 'SOL' as const },         // ~$70,000
    perDay: { amount: 2000.0, currency: 'SOL' as const },         // ~$280,000
    requireApprovalAbove: { amount: 50.0, currency: 'SOL' as const }, // ~$7,000
    reserveSolForGas: 0.001, // ~$0.14 (enough for ~200 transactions)
  },
};

export const DEFAULT_GUARDRAILS: GuardrailsConfig = {
  enabled: false, // Disabled by default - users opt-in for safety
  limits: RISK_PROFILES.micro, // Start with safest defaults
  transactions: [],
};
