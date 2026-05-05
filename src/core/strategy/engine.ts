import { Strategy, StrategyStatus } from '../../types/strategy';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomBytes } from 'crypto';

export class StrategyEngine {
  private static readonly STRATEGIES_DIR = path.join(
    os.homedir(),
    '.paw',
    'strategies'
  );

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  static generateStrategyId(): string {
    return `strat_${Date.now()}_${randomBytes(6).toString('hex')}`;
  }

  private static getStrategyPath(strategyId: string): string {
    return path.join(this.STRATEGIES_DIR, `${strategyId}.json`);
  }

  private static async ensureDir(): Promise<void> {
    await fs.mkdir(this.STRATEGIES_DIR, { recursive: true });
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  static async saveStrategy(strategy: Strategy): Promise<void> {
    await this.ensureDir();
    strategy.updated_at = new Date().toISOString();
    await fs.writeFile(
      this.getStrategyPath(strategy.strategy_id),
      JSON.stringify(strategy, null, 2)
    );
  }

  static async loadStrategy(strategyId: string): Promise<Strategy> {
    try {
      const data = await fs.readFile(
        this.getStrategyPath(strategyId),
        'utf-8'
      );
      return JSON.parse(data) as Strategy;
    } catch {
      throw new Error(`Strategy "${strategyId}" not found`);
    }
  }

  static async strategyExists(strategyId: string): Promise<boolean> {
    try {
      await fs.access(this.getStrategyPath(strategyId));
      return true;
    } catch {
      return false;
    }
  }

  static async listStrategies(agentId?: string): Promise<Strategy[]> {
    await this.ensureDir();
    const files = await fs.readdir(this.STRATEGIES_DIR);
    const strategies: Strategy[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const data = await fs.readFile(
          path.join(this.STRATEGIES_DIR, file),
          'utf-8'
        );
        const strategy = JSON.parse(data) as Strategy;
        if (!agentId || strategy.agent_id === agentId) {
          strategies.push(strategy);
        }
      } catch {
        // Skip corrupted files
      }
    }

    return strategies.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  static async deleteStrategy(strategyId: string): Promise<void> {
    try {
      await fs.unlink(this.getStrategyPath(strategyId));
    } catch {
      // Already gone
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle transitions
  // ---------------------------------------------------------------------------

  static async setStatus(
    strategyId: string,
    status: StrategyStatus,
    extra?: Partial<Strategy>
  ): Promise<Strategy> {
    const strategy = await this.loadStrategy(strategyId);
    strategy.status = status;
    if (extra) {
      Object.assign(strategy, extra);
    }
    if (
      status === 'completed' ||
      status === 'cancelled' ||
      status === 'failed'
    ) {
      strategy.completed_at = new Date().toISOString();
    }
    await this.saveStrategy(strategy);
    return strategy;
  }

  static async pause(strategyId: string): Promise<void> {
    const strategy = await this.loadStrategy(strategyId);
    if (!['pending', 'active'].includes(strategy.status)) {
      throw new Error(
        `Cannot pause strategy with status "${strategy.status}"`
      );
    }
    await this.setStatus(strategyId, 'paused');
  }

  static async resume(strategyId: string): Promise<void> {
    const strategy = await this.loadStrategy(strategyId);
    if (strategy.status !== 'paused') {
      throw new Error(
        `Cannot resume strategy with status "${strategy.status}"`
      );
    }
    // Restore to active (or pending if entry was never executed)
    const nextStatus: StrategyStatus = strategy.position ? 'active' : 'pending';
    await this.setStatus(strategyId, nextStatus);
  }

  static async cancel(strategyId: string): Promise<void> {
    const strategy = await this.loadStrategy(strategyId);
    if (['completed', 'cancelled'].includes(strategy.status)) {
      throw new Error(
        `Strategy is already "${strategy.status}"`
      );
    }
    await this.setStatus(strategyId, 'cancelled');
  }
}
