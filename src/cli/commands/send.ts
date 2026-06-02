import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SignerEngine } from '../../core/signer/engine';
import { SolanaClient } from '../../utils/solana';
import { FileSystemStorage } from '../../core/storage/filesystem';
import { GuardrailsEngine } from '../../core/guardrails/engine';
import { EventLogger } from '../../core/events/logger';
import {
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
  Cluster,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint,
} from '@solana/spl-token';

export const sendCommand = new Command('send')
  .description('📟 Send SOL or SPL tokens to another address')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .requiredOption('--to <address>', 'Recipient address')
  .requiredOption('--amount <amount>', 'Amount to send')
  .option('--token <mint>', 'SPL token mint address (omit for SOL)')
  .option('--network <network>', 'Network to use (overrides config)')
  .action(async (agentIdArg, options) => {
    // Support both positional and flag syntax
    const agentId = agentIdArg || options.agentId;
    
    if (!agentId) {
      console.error('\n❌ Error: Agent ID is required');
      console.log('\nUsage: paw send <agent-id> --to <address> --amount <amount>');
      console.log('   or: paw send --agent-id <agent-id> --to <address> --amount <amount>');
      console.log('');
      process.exit(1);
    }

    try {
      // Use network from options or fall back to config
      const config = await FileSystemStorage.loadConfig(agentId);
      const network = options.network || config.network || 'mainnet-beta';

      const isSPLToken = !!options.token;

      console.log('\n📟 PAW - Send Transaction');
      console.log('Agent ID:', agentId);
      console.log('To:      ', options.to);
      console.log('Amount:  ', options.amount, isSPLToken ? 'tokens' : 'SOL');
      if (isSPLToken) {
        console.log('Token:   ', options.token);
      }
      console.log('Network: ', network);

      // Check guardrails before proceeding
      const amount = parseFloat(options.amount);
      const guardrailCheck = await GuardrailsEngine.checkTransaction(
        agentId,
        amount,
        'SOL', // For now, assume SOL (TODO: handle SPL tokens)
        'send'
      );

      if (!guardrailCheck.allowed) {
        await EventLogger.log(
          agentId,
          'guardrail_blocked',
          'warning',
          `Send blocked: ${guardrailCheck.reason}`,
          { to: options.to, amount, token: options.token || 'SOL' }
        );
        
        console.log('\n🛡️  Guardrails: Transaction blocked');
        console.log('Reason:', guardrailCheck.reason);
        console.log('');
        console.log('To adjust limits: paw guardrails', agentId, '--show');
        process.exit(1);
      }

      if (guardrailCheck.requiresApproval) {
        await EventLogger.log(
          agentId,
          'guardrail_approved',
          'info',
          `Send requires approval: ${amount} ${isSPLToken ? 'tokens' : 'SOL'}`,
          { to: options.to, amount, token: options.token || 'SOL' }
        );
        
        console.log('\n⚠️  Guardrails: This transaction requires approval');
        console.log('Amount exceeds approval threshold');
        console.log('');
        console.log('To proceed, use: --force flag (coming soon)');
        console.log('Or adjust threshold: paw guardrails', agentId, '--approval-threshold <amount>');
        process.exit(1);
      }

      // Load keypair
      const keypair = await WalletManager.loadKeypairAuto(agentId);

      // Get connection
      const connection = SolanaClient.getConnection(network as Cluster, config.rpcUrl);

      let transaction: Transaction;

      if (isSPLToken) {
        // SPL Token Transfer
        console.log('\nPreparing SPL token transfer...');
        
        const mintPubkey = new PublicKey(options.token);
        const recipientPubkey = new PublicKey(options.to);

        // Get mint info to determine decimals
        const mintInfo = await getMint(connection, mintPubkey);
        const decimals = mintInfo.decimals;
        const amount = Math.floor(parseFloat(options.amount) * Math.pow(10, decimals));

        console.log('Token decimals:', decimals);

        // Get or create associated token accounts
        console.log('Getting token accounts...');
        const sourceAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          keypair,
          mintPubkey,
          keypair.publicKey
        );

        const destinationAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          keypair,
          mintPubkey,
          recipientPubkey
        );

        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
          sourceAccount.address,
          destinationAccount.address,
          keypair.publicKey,
          amount
        );

        transaction = new Transaction().add(transferInstruction);
      } else {
        // SOL Transfer
        const lamports = Math.floor(parseFloat(options.amount) * LAMPORTS_PER_SOL);
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: new PublicKey(options.to),
          lamports,
        });

        transaction = new Transaction().add(transferInstruction);
      }

      // Sign and send
      console.log('\nSigning transaction...');
      const signature = await SignerEngine.signAndSend(
        transaction,
        keypair,
        connection
      );

      // Record transaction in guardrails
      await GuardrailsEngine.recordTransaction(
        agentId,
        amount,
        'SOL',
        'send',
        guardrailCheck.requiresApproval
      );

      // Log event
      await EventLogger.log(
        agentId,
        'transaction_executed',
        'info',
        `Send completed: ${amount} ${isSPLToken ? 'tokens' : 'SOL'} to ${options.to}`,
        {
          type: 'send',
          to: options.to,
          amount,
          token: options.token || 'SOL',
          signature,
          explorer: SolanaClient.getExplorerUrl('tx', signature, network as Cluster),
        }
      );

      console.log('\n✅ Transaction sent!');
      console.log('Signature:', signature);
      console.log('Explorer: ', SolanaClient.getExplorerUrl('tx', signature, network as Cluster));
      console.log('');
    } catch (error) {
      // Log error
      await EventLogger.log(
        agentId,
        'error_occurred',
        'error',
        `Send error: ${(error as Error).message}`,
        { type: 'send', to: options.to, amount: options.amount }
      );
      
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
