/**
 * Strategy Engine Tests
 */

import { StrategyEngine } from '../src/core/strategy/engine';
import { StrategyRunner } from '../src/core/strategy/runner';
import { Strategy, ExitCondition } from '../src/types/strategy';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Use a temporary directory so tests don't pollute ~/.paw/strategies
const TEMP_DIR = path.join(os.tmpdir(), `paw-strategy-test-${Date.now()}`);

// Patch the private static path used by StrategyEngine
beforeAll(async () => {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  // Override the private constant via prototype patching (test-only approach)
  (StrategyEngine as any).STRATEGIES_DIR = TEMP_DIR;
});

afterAll(async () => {
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

// ---------------------------------------------------------------------------
// Helper – build a minimal valid strategy
// ---------------------------------------------------------------------------
function buildStrategy(overrides: Partial<Strategy> = {}): Strategy {
  const now = new Date().toISOString();
  return {
    strategy_id: StrategyEngine.generateStrategyId(),
    agent_id: 'test-agent',
    description: 'test strategy',
    type: 'moonshot',
    status: 'pending',
    created_at: now,
    updated_at: now,
    entry: {
      token_mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      token_symbol: 'BONK',
      token_decimals: 5, // BONK uses 5 decimals
      budget: 0.1,
      currency: 'SOL',
      max_slippage_pct: 5,
    },
    exits: [],
    monitor_interval_seconds: 60,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateStrategyId
// ---------------------------------------------------------------------------
describe('StrategyEngine.generateStrategyId', () => {
  it('should produce IDs that start with strat_', () => {
    const id = StrategyEngine.generateStrategyId();
    expect(id.startsWith('strat_')).toBe(true);
  });

  it('should produce unique IDs', () => {
    const ids = new Set(Array.from({ length: 20 }, () => StrategyEngine.generateStrategyId()));
    expect(ids.size).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Save / Load / Exists
// ---------------------------------------------------------------------------
describe('StrategyEngine – CRUD', () => {
  it('should save and load a strategy', async () => {
    const s = buildStrategy();
    await StrategyEngine.saveStrategy(s);

    const loaded = await StrategyEngine.loadStrategy(s.strategy_id);
    expect(loaded.strategy_id).toBe(s.strategy_id);
    expect(loaded.agent_id).toBe(s.agent_id);
    expect(loaded.type).toBe('moonshot');
    expect(loaded.status).toBe('pending');
  });

  it('should return true from strategyExists after save', async () => {
    const s = buildStrategy();
    await StrategyEngine.saveStrategy(s);
    expect(await StrategyEngine.strategyExists(s.strategy_id)).toBe(true);
  });

  it('should return false from strategyExists for unknown id', async () => {
    expect(await StrategyEngine.strategyExists('nonexistent_strat')).toBe(false);
  });

  it('should throw when loading unknown strategy', async () => {
    await expect(
      StrategyEngine.loadStrategy('definitely_not_real')
    ).rejects.toThrow('not found');
  });

  it('should update updated_at on save', async () => {
    const s = buildStrategy();
    const original = s.updated_at;
    await new Promise(r => setTimeout(r, 5)); // ensure timestamp difference
    await StrategyEngine.saveStrategy(s);
    const loaded = await StrategyEngine.loadStrategy(s.strategy_id);
    expect(new Date(loaded.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(original).getTime()
    );
  });

  it('should list saved strategies', async () => {
    // Clear directory
    const files = await fs.readdir(TEMP_DIR);
    for (const f of files) await fs.unlink(path.join(TEMP_DIR, f));

    const s1 = buildStrategy({ agent_id: 'agent-A' });
    const s2 = buildStrategy({ agent_id: 'agent-B' });
    const s3 = buildStrategy({ agent_id: 'agent-A' });
    await Promise.all([
      StrategyEngine.saveStrategy(s1),
      StrategyEngine.saveStrategy(s2),
      StrategyEngine.saveStrategy(s3),
    ]);

    const all = await StrategyEngine.listStrategies();
    expect(all.length).toBe(3);

    const forA = await StrategyEngine.listStrategies('agent-A');
    expect(forA.length).toBe(2);
    expect(forA.every(s => s.agent_id === 'agent-A')).toBe(true);
  });

  it('should delete a strategy', async () => {
    const s = buildStrategy();
    await StrategyEngine.saveStrategy(s);
    await StrategyEngine.deleteStrategy(s.strategy_id);
    expect(await StrategyEngine.strategyExists(s.strategy_id)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Lifecycle transitions
// ---------------------------------------------------------------------------
describe('StrategyEngine – lifecycle', () => {
  it('should pause an active strategy', async () => {
    const s = buildStrategy({ status: 'active' });
    await StrategyEngine.saveStrategy(s);
    await StrategyEngine.pause(s.strategy_id);
    const loaded = await StrategyEngine.loadStrategy(s.strategy_id);
    expect(loaded.status).toBe('paused');
  });

  it('should pause a pending strategy', async () => {
    const s = buildStrategy({ status: 'pending' });
    await StrategyEngine.saveStrategy(s);
    await StrategyEngine.pause(s.strategy_id);
    const loaded = await StrategyEngine.loadStrategy(s.strategy_id);
    expect(loaded.status).toBe('paused');
  });

  it('should throw when pausing a completed strategy', async () => {
    const s = buildStrategy({ status: 'completed' });
    await StrategyEngine.saveStrategy(s);
    await expect(StrategyEngine.pause(s.strategy_id)).rejects.toThrow();
  });

  it('should resume a paused strategy (no position → pending)', async () => {
    const s = buildStrategy({ status: 'paused' });
    await StrategyEngine.saveStrategy(s);
    await StrategyEngine.resume(s.strategy_id);
    const loaded = await StrategyEngine.loadStrategy(s.strategy_id);
    expect(loaded.status).toBe('pending');
  });

  it('should resume a paused strategy with position → active', async () => {
    const s = buildStrategy({
      status: 'paused',
      position: {
        amount: 100,
        cost_basis_usd: 10,
        entry_price_usd: 0.1,
        entry_timestamp: new Date().toISOString(),
        entry_tx: 'fakeTx',
      },
    });
    await StrategyEngine.saveStrategy(s);
    await StrategyEngine.resume(s.strategy_id);
    const loaded = await StrategyEngine.loadStrategy(s.strategy_id);
    expect(loaded.status).toBe('active');
  });

  it('should throw when resuming a non-paused strategy', async () => {
    const s = buildStrategy({ status: 'active' });
    await StrategyEngine.saveStrategy(s);
    await expect(StrategyEngine.resume(s.strategy_id)).rejects.toThrow();
  });

  it('should cancel an active strategy', async () => {
    const s = buildStrategy({ status: 'active' });
    await StrategyEngine.saveStrategy(s);
    await StrategyEngine.cancel(s.strategy_id);
    const loaded = await StrategyEngine.loadStrategy(s.strategy_id);
    expect(loaded.status).toBe('cancelled');
    expect(loaded.completed_at).toBeDefined();
  });

  it('should throw when cancelling an already-cancelled strategy', async () => {
    const s = buildStrategy({ status: 'cancelled' });
    await StrategyEngine.saveStrategy(s);
    await expect(StrategyEngine.cancel(s.strategy_id)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// setStatus helper
// ---------------------------------------------------------------------------
describe('StrategyEngine.setStatus', () => {
  it('should set completed_at when status is completed', async () => {
    const s = buildStrategy({ status: 'active' });
    await StrategyEngine.saveStrategy(s);
    const updated = await StrategyEngine.setStatus(s.strategy_id, 'completed');
    expect(updated.status).toBe('completed');
    expect(updated.completed_at).toBeDefined();
  });

  it('should apply extra fields', async () => {
    const s = buildStrategy({ status: 'active' });
    await StrategyEngine.saveStrategy(s);
    const updated = await StrategyEngine.setStatus(s.strategy_id, 'failed', {
      error: 'test error',
    });
    expect(updated.error).toBe('test error');
  });
});

// ---------------------------------------------------------------------------
// StrategyRunner.checkExitCondition (via tick – white-box test)
// ---------------------------------------------------------------------------
describe('StrategyRunner – exit condition evaluation', () => {
  // Access private method via type cast
  const checkExit = (StrategyRunner as any).checkExitCondition.bind(StrategyRunner) as (
    exit: ExitCondition,
    currentValueUsd: number,
    costBasisUsd: number,
    entryTimestampMs: number
  ) => boolean;

  const baseExit: ExitCondition = {
    name: 'test',
    type: 'take_profit',
    multiplier: 2.0,
    action: 'sell_all',
    priority: 1,
    triggered: false,
  };

  it('take_profit fires when value reaches multiplier', () => {
    expect(checkExit({ ...baseExit, type: 'take_profit', multiplier: 2.0 }, 20, 10, Date.now())).toBe(true);
    expect(checkExit({ ...baseExit, type: 'take_profit', multiplier: 2.0 }, 19.99, 10, Date.now())).toBe(false);
  });

  it('stop_loss fires when value drops to multiplier', () => {
    expect(checkExit({ ...baseExit, type: 'stop_loss', multiplier: 0.5 }, 5, 10, Date.now())).toBe(true);
    expect(checkExit({ ...baseExit, type: 'stop_loss', multiplier: 0.5 }, 5.01, 10, Date.now())).toBe(false);
  });

  it('time_exit fires after duration elapsed', () => {
    const longAgo = Date.now() - 100_000; // 100 seconds ago
    expect(checkExit({ ...baseExit, type: 'time_exit', duration_seconds: 60 }, 0, 0, longAgo)).toBe(true);
    expect(checkExit({ ...baseExit, type: 'time_exit', duration_seconds: 200 }, 0, 0, longAgo)).toBe(false);
  });

  it('returns false for unknown type', () => {
    expect(checkExit({ ...baseExit, type: 'unknown' as any }, 100, 10, Date.now())).toBe(false);
  });
});
