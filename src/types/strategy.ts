export type StrategyType = 'moonshot' | 'dca';

export type StrategyStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type ExitConditionType = 'take_profit' | 'stop_loss' | 'time_exit';

export type ExitAction = 'sell_all' | 'sell_50' | 'sell_25';

export interface ExitCondition {
  name: string;
  type: ExitConditionType;
  /** For take_profit/stop_loss: multiplier on cost basis (e.g. 2.0 means value doubles). */
  multiplier?: number;
  /** For time_exit: seconds after entry before selling. */
  duration_seconds?: number;
  action: ExitAction;
  priority: number;
  triggered: boolean;
  triggered_at?: string;
}

export interface StrategyEntry {
  /** Mint address of the token to buy. */
  token_mint: string;
  token_symbol: string;
  token_decimals: number;
  budget: number;
  currency: 'SOL' | 'USDC';
  max_slippage_pct: number;
}

export interface StrategyPosition {
  amount: number;
  cost_basis_usd: number;
  entry_price_usd: number;
  entry_timestamp: string;
  entry_tx: string;
}

/** Present only when type === 'dca'. */
export interface DCASchedule {
  interval_seconds: number;
  runs_total: number;
  runs_completed: number;
  next_run_at: string;
}

export interface Strategy {
  strategy_id: string;
  agent_id: string;
  description: string;
  type: StrategyType;
  status: StrategyStatus;
  created_at: string;
  updated_at: string;
  entry: StrategyEntry;
  exits: ExitCondition[];
  position?: StrategyPosition;
  dca?: DCASchedule;
  monitor_interval_seconds: number;
  last_checked_at?: string;
  completed_at?: string;
  error?: string;
}
