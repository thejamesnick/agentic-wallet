export type EventType =
  | 'transaction_executed'
  | 'transaction_failed'
  | 'balance_changed'
  | 'guardrail_blocked'
  | 'guardrail_approved'
  | 'error_occurred'
  | 'wallet_created'
  | 'config_updated'
  | 'strategy_created'
  | 'strategy_entry_executed'
  | 'strategy_exit_triggered'
  | 'strategy_completed'
  | 'strategy_cancelled'
  | 'strategy_failed';

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface WalletEvent {
  event_id: string;
  timestamp: string;
  agent_id: string;
  type: EventType;
  severity: EventSeverity;
  payload: Record<string, any>;
  message: string;
}

export interface EventSubscription {
  agent_id: string;
  format: 'file' | 'json' | 'webhook';
  path?: string; // For file format
  url?: string; // For webhook format
  events?: EventType[]; // Filter specific events, or all if undefined
  enabled: boolean;
  retry?: number; // Number of retries for webhooks (default: 3)
  timeout?: number; // Timeout in ms for webhooks (default: 5000)
}

export interface EventLogConfig {
  subscriptions: EventSubscription[];
}
