import { Command } from 'commander';
import path from 'path';

export const agentRunCommand = new Command('run')
  .description('🤖 Run autonomous agent with specified strategy')
  .requiredOption('--agent-id <id>', 'Agent identifier')
  .requiredOption('--strategy <type>', 'Strategy type: dca, rebalance, or signal')
  .option('--target-token <symbol>', 'Target token to acquire (e.g., SOL)', 'SOL')
  .option('--payment-token <symbol>', 'Token to pay with (e.g., USDC)', 'USDC')
  .option('--amount <number>', 'Amount to spend per execution', '1.0')
  .option('--schedule <freq>', 'Execution schedule: once, hourly, daily, weekly', 'daily')
  .option('--time <hh:mm>', 'Time for scheduled execution (HH:MM format)', '14:00')
  .option('--once', 'Run agent once immediately')
  .option('--wallet-address <address>', 'Wallet address to use for strategy executions')
  .option('--allow-mock', 'Allow mock execution when ZERION_API_KEY is not set (overrides ALLOW_MOCK env)')
  .option('--interval <ms>', 'Loop interval in milliseconds (for continuous)', '60000')
  .action(async (options) => {
    try {
      console.log('\n📟 PAW - Agent Run');
      console.log(`Agent ID:     ${options.agentId}`);
      console.log(`Strategy:     ${options.strategy}`);
      console.log(`Target:       ${options.amount} ${options.paymentToken} → ${options.targetToken}`);
      console.log(`Schedule:     ${options.schedule}${options.time ? ` at ${options.time}` : ''}`);
      console.log('');

      // Import Zerion agent runner (from submission folder)
      // Use absolute file URLs for .mjs imports from CommonJS
      const runnerPath = path.resolve(__dirname, '../../../submission/zerion-cli-fork/cli/integrations/agent/runner.mjs');
      const policyPath = path.resolve(__dirname, '../../../submission/zerion-cli-fork/cli/core/policies/engine.mjs');
      
      // @ts-ignore - .mjs files don't have type declarations
      const { AgentRunner } = await import(runnerPath);
      // @ts-ignore - .mjs files don't have type declarations
      const { PolicyEngine } = await import(policyPath);

      const policyEngine = new PolicyEngine();

      // Per-run allow-mock override
      if (options.allowMock) {
        process.env.ALLOW_MOCK = 'true';
        console.log('⚠️  Per-run: ALLOW_MOCK enabled');
      }

      // TODO: Load actual policy for this agent from storage
      const policyConfig = {
          policyId: `policy-${options.strategy}-${options.agentId}`, // Updated to match strategy-based ID
        agentId: options.agentId,
        spendLimitPerTx: 50, // Example: 50 USDC per transaction
        spendLimitPerDay: 100, // Example: 100 USDC per day
        allowedChains: ['solana'],
        allowedActions: ['swap', 'rebalance'],
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      policyEngine.registerPolicy(policyConfig);

      const runner = new AgentRunner(options.agentId, policyEngine);

      // Register strategy
      const strategyConfig = {
        agentId: options.agentId,
        strategyId: `${options.strategy}-${options.agentId}`,
        type: options.strategy,
        enabled: true,
        schedule: {
          frequency: options.schedule,
          time: options.time,
        },
        targetAsset: options.targetToken,
        paymentAsset: options.paymentToken,
        walletAddress: options.walletAddress || null,
        amount: parseFloat(options.amount),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      runner.registerStrategy(strategyConfig);

      // Run agent
      if (options.once) {
        await runner.runOnce();
      } else {
        const interval = parseInt(options.interval, 10);
        await runner.start(interval);
      }

      // Print summary
      const summary = runner.getExecutionSummary();
      console.log('\n📊 Execution Summary:');
      console.log(`   Total:     ${summary.totalExecutions}`);
      console.log(`   Successful: ${summary.successfulExecutions}`);
      console.log(`   Failed:    ${summary.failedExecutions}`);
      console.log(`   Spent:     ${summary.totalSpend} ${options.paymentToken}\n`);
    } catch (error: any) {
      console.error('\n❌ Error:', error.message);
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
      process.exit(1);
    }
  });
