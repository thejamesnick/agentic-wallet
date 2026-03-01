import { GuardrailsConfig, TransactionRecord, SpendingLimits, DEFAULT_GUARDRAILS } from '../../types/guardrails';
import { FileSystemStorage } from '../storage/filesystem';
import { PriceService } from '../../utils/price';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export class GuardrailsEngine {
  private static readonly GUARDRAILS_DIR = path.join(os.homedir(), '.paw', 'guardrails');

  /**
   * Get guardrails file path for an agent
   */
  private static getGuardrailsPath(agentId: string): string {
    return path.join(this.GUARDRAILS_DIR, `${agentId}.json`);
  }

  /**
   * Ensure guardrails directory exists
   */
  private static async ensureDir(): Promise<void> {
    await fs.mkdir(this.GUARDRAILS_DIR, { recursive: true });
  }

  /**
   * Load guardrails config for an agent
   */
  static async loadConfig(agentId: string): Promise<GuardrailsConfig> {
    try {
      const configPath = this.getGuardrailsPath(agentId);
      const data = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      // Return default config if not found
      return { ...DEFAULT_GUARDRAILS };
    }
  }

  /**
   * Save guardrails config for an agent
   */
  static async saveConfig(agentId: string, config: GuardrailsConfig): Promise<void> {
    await this.ensureDir();
    const configPath = this.getGuardrailsPath(agentId);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Enable guardrails for an agent
   */
  static async enable(agentId: string, limits?: Partial<SpendingLimits>): Promise<void> {
    const config = await this.loadConfig(agentId);
    config.enabled = true;
    
    if (limits) {
      config.limits = { ...config.limits, ...limits };
    }
    
    await this.saveConfig(agentId, config);
  }

  /**
   * Disable guardrails for an agent
   */
  static async disable(agentId: string): Promise<void> {
    const config = await this.loadConfig(agentId);
    config.enabled = false;
    await this.saveConfig(agentId, config);
  }

  /**
   * Record a transaction
   */
  static async recordTransaction(
    agentId: string,
    amount: number,
    currency: 'SOL' | 'USD',
    type: 'buy' | 'sell' | 'swap' | 'send',
    approved: boolean = false
  ): Promise<void> {
    const config = await this.loadConfig(agentId);
    
    const record: TransactionRecord = {
      timestamp: Date.now(),
      amount,
      currency,
      type,
      approved,
    };
    
    config.transactions.push(record);
    
    // Keep only last 1000 transactions
    if (config.transactions.length > 1000) {
      config.transactions = config.transactions.slice(-1000);
    }
    
    await this.saveConfig(agentId, config);
  }

  /**
   * Convert amount to SOL for comparison
   */
  private static async convertToSol(amount: number, currency: 'SOL' | 'USD'): Promise<number> {
    if (currency === 'SOL') {
      return amount;
    }
    
    // Convert USD to SOL
    const solPrice = await PriceService.getSolPrice();
    return amount / solPrice;
  }

  /**
   * Get spending in time window
   */
  private static getSpendingInWindow(
    transactions: TransactionRecord[],
    windowMs: number
  ): { sol: number; usd: number } {
    const now = Date.now();
    const cutoff = now - windowMs;
    
    const recentTxs = transactions.filter(tx => tx.timestamp >= cutoff);
    
    let solSpent = 0;
    let usdSpent = 0;
    
    for (const tx of recentTxs) {
      if (tx.currency === 'SOL') {
        solSpent += tx.amount;
      } else {
        usdSpent += tx.amount;
      }
    }
    
    return { sol: solSpent, usd: usdSpent };
  }

  /**
   * Check if transaction is allowed
   */
  static async checkTransaction(
    agentId: string,
    amount: number,
    currency: 'SOL' | 'USD',
    type: 'buy' | 'sell' | 'swap' | 'send'
  ): Promise<{ allowed: boolean; reason?: string; requiresApproval: boolean }> {
    const config = await this.loadConfig(agentId);
    
    // If guardrails disabled, allow everything
    if (!config.enabled) {
      return { allowed: true, requiresApproval: false };
    }
    
    const amountInSol = await this.convertToSol(amount, currency);
    
    // Check per-transaction limit
    const perTxLimitSol = await this.convertToSol(
      config.limits.perTransaction.amount,
      config.limits.perTransaction.currency
    );
    
    if (amountInSol > perTxLimitSol) {
      return {
        allowed: false,
        reason: `Transaction amount (${amountInSol.toFixed(4)} SOL) exceeds per-transaction limit (${perTxLimitSol.toFixed(4)} SOL)`,
        requiresApproval: false,
      };
    }
    
    // Check hourly limit
    const hourlySpending = this.getSpendingInWindow(config.transactions, 60 * 60 * 1000);
    const hourlyLimitSol = await this.convertToSol(
      config.limits.perHour.amount,
      config.limits.perHour.currency
    );
    
    if (hourlySpending.sol + amountInSol > hourlyLimitSol) {
      return {
        allowed: false,
        reason: `Would exceed hourly limit. Spent: ${hourlySpending.sol.toFixed(4)} SOL, Limit: ${hourlyLimitSol.toFixed(4)} SOL`,
        requiresApproval: false,
      };
    }
    
    // Check daily limit
    const dailySpending = this.getSpendingInWindow(config.transactions, 24 * 60 * 60 * 1000);
    const dailyLimitSol = await this.convertToSol(
      config.limits.perDay.amount,
      config.limits.perDay.currency
    );
    
    if (dailySpending.sol + amountInSol > dailyLimitSol) {
      return {
        allowed: false,
        reason: `Would exceed daily limit. Spent: ${dailySpending.sol.toFixed(4)} SOL, Limit: ${dailyLimitSol.toFixed(4)} SOL`,
        requiresApproval: false,
      };
    }
    
    // Check if requires approval
    const approvalThresholdSol = await this.convertToSol(
      config.limits.requireApprovalAbove.amount,
      config.limits.requireApprovalAbove.currency
    );
    
    const requiresApproval = amountInSol > approvalThresholdSol;
    
    return {
      allowed: true,
      requiresApproval,
    };
  }

  /**
   * Get spending summary
   */
  static async getSpendingSummary(agentId: string): Promise<{
    hourly: { sol: number; usd: number };
    daily: { sol: number; usd: number };
    limits: SpendingLimits;
  }> {
    const config = await this.loadConfig(agentId);
    
    const hourly = this.getSpendingInWindow(config.transactions, 60 * 60 * 1000);
    const daily = this.getSpendingInWindow(config.transactions, 24 * 60 * 60 * 1000);
    
    return {
      hourly,
      daily,
      limits: config.limits,
    };
  }
}
