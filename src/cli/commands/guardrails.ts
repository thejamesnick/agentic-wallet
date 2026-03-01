import { Command } from 'commander';
import { GuardrailsEngine } from '../../core/guardrails/engine';
import { RISK_PROFILES } from '../../types/guardrails';

export const guardrailsCommand = new Command('guardrails')
  .description('📟 Manage spending limits and safety guardrails')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .option('--enable', 'Enable guardrails (protects from draining wallet)')
  .option('--disable', 'Disable guardrails (removes all limits)')
  .option('--profile <profile>', 'Use risk profile: micro, conservative, moderate, degen, whale')
  .option('--per-tx <amount>', 'Per-transaction limit (SOL)')
  .option('--per-hour <amount>', 'Per-hour limit (SOL)')
  .option('--per-day <amount>', 'Per-day limit (SOL)')
  .option('--approval-threshold <amount>', 'Require approval above this amount (SOL)')
  .option('--reserve-gas <amount>', 'Reserve SOL for gas (SOL)')
  .option('--show', 'Show current guardrails and spending')
  .action(async (agentIdArg, options) => {
    try {
      // Support both positional and flag syntax
      const agentId = agentIdArg || options.agentId;
      
      if (!agentId) {
        console.error('\n❌ Error: Agent ID is required');
        console.log('\nUsage: paw guardrails <agent-id> [options]');
        console.log('   or: paw guardrails --agent-id <agent-id> [options]');
        console.log('');
        console.log('Examples:');
        console.log('  paw guardrails agent-alice --enable --profile micro    # For $100 wallets');
        console.log('  paw guardrails agent-alice --enable --profile degen    # For meme trading');
        console.log('  paw guardrails agent-alice --disable                   # Turn off limits');
        console.log('  paw guardrails agent-alice --show                      # Check status');
        console.log('');
        process.exit(1);
      }

      console.log('\n📟 PAW - Guardrails');
      console.log('Agent ID:', agentId);
      console.log('');

      // Enable guardrails
      if (options.enable) {
        let limits: any = {};
        
        // Use risk profile if specified
        if (options.profile) {
          const profile = options.profile.toLowerCase();
          if (!RISK_PROFILES[profile as keyof typeof RISK_PROFILES]) {
            console.error('❌ Invalid profile. Choose: micro, conservative, moderate, degen, whale');
            process.exit(1);
          }
          limits = RISK_PROFILES[profile as keyof typeof RISK_PROFILES];
          console.log(`📊 Using ${profile} risk profile`);
        } else {
          // Default to micro if no profile specified
          limits = RISK_PROFILES.micro;
          console.log('📊 Using micro risk profile (default for safety)');
        }
        
        // Override with custom values if provided
        if (options.perTx) {
          limits.perTransaction = { amount: parseFloat(options.perTx), currency: 'SOL' };
        }
        if (options.perHour) {
          limits.perHour = { amount: parseFloat(options.perHour), currency: 'SOL' };
        }
        if (options.perDay) {
          limits.perDay = { amount: parseFloat(options.perDay), currency: 'SOL' };
        }
        if (options.approvalThreshold) {
          limits.requireApprovalAbove = { amount: parseFloat(options.approvalThreshold), currency: 'SOL' };
        }
        if (options.reserveGas) {
          limits.reserveSolForGas = parseFloat(options.reserveGas);
        }
        
        await GuardrailsEngine.enable(agentId, limits);
        console.log('✅ Guardrails enabled - Your wallet is now protected!');
        console.log('');
      }

      // Disable guardrails
      if (options.disable) {
        await GuardrailsEngine.disable(agentId);
        console.log('⚠️  Guardrails disabled - No spending limits active!');
        console.log('💡 Tip: Enable guardrails to protect from draining wallet');
        console.log('');
      }

      // Show current config and spending
      if (options.show || (!options.enable && !options.disable)) {
        const config = await GuardrailsEngine.loadConfig(agentId);
        const summary = await GuardrailsEngine.getSpendingSummary(agentId);

        console.log('🛡️  Guardrails Status:', config.enabled ? '✅ Enabled' : '❌ Disabled');
        console.log('');
        
        console.log('📊 Spending Limits:');
        console.log('   Per Transaction:', summary.limits.perTransaction.amount, summary.limits.perTransaction.currency);
        console.log('   Per Hour:       ', summary.limits.perHour.amount, summary.limits.perHour.currency);
        console.log('   Per Day:        ', summary.limits.perDay.amount, summary.limits.perDay.currency);
        console.log('   Approval Above: ', summary.limits.requireApprovalAbove.amount, summary.limits.requireApprovalAbove.currency);
        console.log('   Reserve for Gas:', summary.limits.reserveSolForGas, 'SOL');
        console.log('');
        
        console.log('💸 Current Spending:');
        console.log('   Last Hour:', summary.hourly.sol.toFixed(4), 'SOL');
        console.log('   Last Day: ', summary.daily.sol.toFixed(4), 'SOL');
        console.log('');
        
        // Show remaining limits
        const hourlyRemaining = summary.limits.perHour.amount - summary.hourly.sol;
        const dailyRemaining = summary.limits.perDay.amount - summary.daily.sol;
        
        console.log('✅ Remaining Limits:');
        console.log('   This Hour:', hourlyRemaining.toFixed(4), 'SOL');
        console.log('   Today:    ', dailyRemaining.toFixed(4), 'SOL');
        console.log('');
      }
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
