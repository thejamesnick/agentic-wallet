import { Command } from 'commander';

export const agentStatusCommand = new Command('status')
  .description('📊 Monitor agent execution status and history')
  .requiredOption('--agent-id <id>', 'Agent identifier')
  .option('--limit <number>', 'Number of recent executions to show', '5')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      console.log('\n📊 PAW - Agent Status');
      console.log(`Agent ID: ${options.agentId}`);
      console.log('');

      // TODO: Load agent runner state from storage
      const summary = {
        agentId: options.agentId,
        status: 'running',
        strategy: 'dca',
        uptime: '2h 15m',
        lastExecution: '5 minutes ago',
        nextExecution: 'in 54 minutes',
      };

      const executions = [
        {
          timestamp: Date.now() - 5 * 60000,
          action: 'swap',
          tokenIn: 'USDC',
          tokenOut: 'SOL',
          amount: 1.0,
          status: 'success',
          txHash: '0x123abc...',
        },
        {
          timestamp: Date.now() - 65 * 60000,
          action: 'swap',
          tokenIn: 'USDC',
          tokenOut: 'SOL',
          amount: 1.0,
          status: 'success',
          txHash: '0x456def...',
        },
        {
          timestamp: Date.now() - 125 * 60000,
          action: 'swap',
          tokenIn: 'USDC',
          tokenOut: 'SOL',
          amount: 1.0,
          status: 'success',
          txHash: '0x789ghi...',
        },
      ];

      if (options.json) {
        console.log(JSON.stringify({ summary, executions }, null, 2));
      } else {
        console.log('Status:');
        console.log(`  Status:          ${summary.status}`);
        console.log(`  Strategy:        ${summary.strategy}`);
        console.log(`  Uptime:          ${summary.uptime}`);
        console.log(`  Last Execution:  ${summary.lastExecution}`);
        console.log(`  Next Execution:  ${summary.nextExecution}`);
        console.log('');

        console.log('Execution History:');
        executions.slice(0, parseInt(options.limit)).forEach((exec, i) => {
          const time = new Date(exec.timestamp).toLocaleTimeString();
          const status = exec.status === 'success' ? '✅' : '❌';
          console.log(`  ${i + 1}. ${time} ${status} ${exec.action}: ${exec.amount} ${exec.tokenIn} → ${exec.tokenOut}`);
          if (exec.txHash) {
            console.log(`     TX: ${exec.txHash}`);
          }
        });
        console.log('');

        console.log('Summary:');
        console.log(`  Total Executions: 47`);
        console.log(`  Successful:       47`);
        console.log(`  Failed:           0`);
        console.log(`  Total Spend:      47.0 USDC`);
        console.log('');
      }
    } catch (error: any) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });
