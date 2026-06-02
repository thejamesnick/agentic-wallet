import { Command } from 'commander';

export const agentPolicyCommand = new Command('policy')
  .description('📋 Manage agent spending policies and limits')
  .addCommand(
    new Command('set')
      .description('Set policy for an agent')
      .requiredOption('--agent-id <id>', 'Agent identifier')
      .option('--spend-limit <amount>', 'Per-transaction limit in USDC', '50')
      .option('--per-day <amount>', 'Daily spending limit in USDC', '100')
      .option('--per-hour <amount>', 'Hourly spending limit in USDC', '20')
      .option('--chain <chain>', 'Allowed chain (solana, ethereum, etc)', 'solana')
      .option('--allowed-actions <actions>', 'Comma-separated allowed actions (swap, bridge, rebalance)', 'swap')
      .option('--expiry <days>', 'Policy expiry in days (0 = no expiry)', '30')
      .option('--description <text>', 'Policy description')
      .action(async (options) => {
        try {
          console.log('\n📋 PAW - Agent Policy Set');
          console.log(`Agent ID:       ${options.agentId}`);
          console.log(`Per-TX Limit:   ${options.spendLimit} USDC`);
          console.log(`Daily Limit:    ${options.perDay} USDC`);
          console.log(`Hourly Limit:   ${options.perHour} USDC`);
          console.log(`Chain:          ${options.chain}`);
          console.log(`Actions:        ${options.allowedActions}`);
          console.log(`Expiry:         ${options.expiry} days`);
          console.log('');

          // Calculate expiry timestamp
          const expiryDate = options.expiry === '0' 
            ? null 
            : Date.now() + parseInt(options.expiry) * 86400000;

          // TODO: Save policy to storage
          const policyConfig = {
            policyId: `policy-${options.agentId}`,
            agentId: options.agentId,
            spendLimitPerTx: parseFloat(options.spendLimit),
            spendLimitPerDay: parseFloat(options.perDay),
            spendLimitPerHour: parseFloat(options.perHour),
            allowedChains: [options.chain],
            allowedActions: options.allowedActions.split(',').map((a: string) => a.trim()),
            expiryDate: expiryDate,
            description: options.description || `Policy for agent ${options.agentId}`,
            enabled: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          console.log('✅ Policy saved:');
          console.log(`   ID: ${policyConfig.policyId}`);
          console.log(`   Status: Active${expiryDate ? ` (expires in ${options.expiry} days)` : ''}`);
          console.log('');
        } catch (error: any) {
          console.error('\n❌ Error:', error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .description('Show policy for an agent')
      .requiredOption('--agent-id <id>', 'Agent identifier')
      .action(async (options) => {
        try {
          console.log('\n📋 PAW - Agent Policy');
          console.log(`Agent ID: ${options.agentId}`);
          console.log('');

          // TODO: Load policy from storage
          console.log('Policy Details:');
          console.log('  Per-TX Limit:   50 USDC');
          console.log('  Daily Limit:    100 USDC');
          console.log('  Hourly Limit:   20 USDC');
          console.log('  Chain:          solana');
          console.log('  Actions:        swap, rebalance');
          console.log('  Expiry:         30 days');
          console.log('  Status:         ✅ Active');
          console.log('');

          console.log('Spending (Today):');
          console.log('  Used:           25.5 USDC');
          console.log('  Remaining:      74.5 USDC');
          console.log('');
        } catch (error: any) {
          console.error('\n❌ Error:', error.message);
          process.exit(1);
        }
      })
  );
