export type EventType =
  | 'transaction_executed'
  | 'transaction_failed'
  | 'balance_changed'
  | 'guardrail_blocked'
  | 'guardrail_approved'
  | 'error_occurred'
  | 'wallet_created'
  | 'config_updated';

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
  format: 'file' | 'json';
  path: string;
  events?: EventType[]; // Filter specific events, or all if undefined
  enabled: boolean;
}

export interface EventLogConfig {
  subscriptions: EventSubscription[];
}
