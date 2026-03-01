import { WalletEvent, EventType, EventSeverity, EventSubscription } from '../../types/events';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomBytes } from 'crypto';

export class EventLogger {
  private static readonly EVENTS_DIR = path.join(os.homedir(), '.paw', 'events');
  private static readonly CONFIG_FILE = path.join(this.EVENTS_DIR, 'config.json');

  /**
   * Ensure events directory exists
   */
  private static async ensureDir(): Promise<void> {
    await fs.mkdir(this.EVENTS_DIR, { recursive: true });
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `evt_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  /**
   * Load event subscriptions config
   */
  static async loadConfig(): Promise<EventSubscription[]> {
    try {
      await this.ensureDir();
      const data = await fs.readFile(this.CONFIG_FILE, 'utf-8');
      const config = JSON.parse(data);
      return config.subscriptions || [];
    } catch {
      return [];
    }
  }

  /**
   * Save event subscriptions config
   */
  static async saveConfig(subscriptions: EventSubscription[]): Promise<void> {
    await this.ensureDir();
    await fs.writeFile(
      this.CONFIG_FILE,
      JSON.stringify({ subscriptions }, null, 2)
    );
  }

  /**
   * Add event subscription
   */
  static async subscribe(subscription: EventSubscription): Promise<void> {
    const subscriptions = await this.loadConfig();
    
    // Remove existing subscription for same agent
    const filtered = subscriptions.filter(s => s.agent_id !== subscription.agent_id);
    
    // Add new subscription
    filtered.push(subscription);
    
    await this.saveConfig(filtered);
  }

  /**
   * Remove event subscription
   */
  static async unsubscribe(agentId: string): Promise<void> {
    const subscriptions = await this.loadConfig();
    const filtered = subscriptions.filter(s => s.agent_id !== agentId);
    await this.saveConfig(filtered);
  }

  /**
   * Get subscription for agent
   */
  static async getSubscription(agentId: string): Promise<EventSubscription | null> {
    const subscriptions = await this.loadConfig();
    return subscriptions.find(s => s.agent_id === agentId) || null;
  }

  /**
   * Log an event
   */
  static async log(
    agentId: string,
    type: EventType,
    severity: EventSeverity,
    message: string,
    payload: Record<string, any> = {}
  ): Promise<void> {
    const event: WalletEvent = {
      event_id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      type,
      severity,
      message,
      payload,
    };

    // Get subscription for this agent
    const subscription = await this.getSubscription(agentId);
    
    if (!subscription || !subscription.enabled) {
      // No subscription or disabled - skip logging
      return;
    }

    // Filter events if specific types are requested
    if (subscription.events && subscription.events.length > 0) {
      if (!subscription.events.includes(type)) {
        return; // Skip this event type
      }
    }

    // Write to file (JSON lines format)
    const eventLine = JSON.stringify(event) + '\n';
    
    try {
      await fs.appendFile(subscription.path, eventLine);
    } catch (error) {
      // If file doesn't exist, create it
      await fs.writeFile(subscription.path, eventLine);
    }
  }

  /**
   * Read recent events from log file
   */
  static async readEvents(agentId: string, limit: number = 100): Promise<WalletEvent[]> {
    const subscription = await this.getSubscription(agentId);
    
    if (!subscription) {
      return [];
    }

    try {
      const data = await fs.readFile(subscription.path, 'utf-8');
      const lines = data.trim().split('\n').filter(line => line.length > 0);
      
      // Parse JSON lines
      const events = lines
        .map(line => {
          try {
            return JSON.parse(line) as WalletEvent;
          } catch {
            return null;
          }
        })
        .filter((e): e is WalletEvent => e !== null);
      
      // Return last N events
      return events.slice(-limit);
    } catch {
      return [];
    }
  }

  /**
   * Clear event log
   */
  static async clearEvents(agentId: string): Promise<void> {
    const subscription = await this.getSubscription(agentId);
    
    if (subscription) {
      try {
        await fs.unlink(subscription.path);
      } catch {
        // File doesn't exist, that's fine
      }
    }
  }
}
