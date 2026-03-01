import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { EventLogger } from '../../core/events/logger';
import { Connection, PublicKey, Cluster } from '@solana/web3.js';
import { FileSystemStorage } from '../../core/storage/filesystem';

export const monitorCommand = new Command('monitor')
  .description('📟 Monitor wallet for real-time balance changes')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .option('--network <network>', 'Network to use (overrides config)')
  .action(async (agentIdArg, options) => {
    // Support both positional and flag syntax
    const agentId = agentIdArg || options.agentId;
    
    if (!agentId) {
      console.error('\n❌ Error: Agent ID is required');
      console.log('\nUsage: paw monitor <agent-id>');
      console.log('   or: paw monitor --agent-id <agent-id>');
      console.log('');
      console.log('This command monitors your wallet for balance changes and fires webhooks.');
      console.log('Make sure you have webhooks enabled:');
      console.log('  paw events <agent-id> --subscribe --format webhook --url <url>');
      console.log('');
      process.exit(1);
    }

    try {
      // Check if webhooks are enabled
      const subscription = await EventLogger.getSubscription(agentId);
      
      if (!subscription || subscription.format !== 'webhook') {
        console.error('\n❌ Error: Webhooks not enabled for this agent');
        console.log('');
        console.log('Enable webhooks first:');
        console.log(`  paw events ${agentId} --subscribe --format webhook --url <url>`);
        console.log('');
        console.log('Example:');
        console.log(`  paw events ${agentId} --subscribe --format webhook --url http://localhost:3000/webhook`);
        console.log('');
        process.exit(1);
      }

      // Use network from options or fall back to config
      let network = options.network;
      if (!network) {
        const config = await FileSystemStorage.loadConfig(agentId);
        network = config.network || 'mainnet-beta';
      }

      // Load wallet address
      const keypair = await WalletManager.loadKeypairAuto(agentId);
      const address = keypair.publicKey.toString();

      console.log('\n📟 PAW - Real-Time Balance Monitor');
      console.log('Agent ID:', agentId);
      console.log('Address: ', address);
      console.log('Network: ', network);
      console.log('Webhook: ', subscription.url);
      console.log('');
      console.log('🔄 Connecting to Helius WebSocket...');

      // Get WebSocket endpoint
      const HELIUS_API_KEY = '2452c60f-ab21-4a80-b486-30f0aca63d2f';
      let wsEndpoint: string;
      
      if (network === 'mainnet-beta') {
        wsEndpoint = `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      } else if (network === 'devnet') {
        wsEndpoint = `wss://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      } else {
        console.error('❌ Error: Only mainnet-beta and devnet are supported');
        process.exit(1);
      }

      // Create WebSocket connection
      const WebSocket = require('ws');
      const ws = new WebSocket(wsEndpoint);

      let lastBalance: number | null = null;
      let reconnectAttempts = 0;
      const MAX_RECONNECT_ATTEMPTS = 10;

      ws.on('open', () => {
        console.log('✅ Connected to Helius WebSocket');
        console.log('👀 Monitoring for balance changes...');
        console.log('');
        console.log('💡 Tip: Keep this running in the background');
        console.log('   Press Ctrl+C to stop monitoring');
        console.log('');
        
        reconnectAttempts = 0;

        // Subscribe to account changes
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'accountSubscribe',
          params: [
            address,
            {
              encoding: 'jsonParsed',
              commitment: 'confirmed'
            }
          ]
        }));
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Handle subscription confirmation
          if (message.result && typeof message.result === 'number') {
            console.log('📡 Subscription ID:', message.result);
            return;
          }

          // Handle account updates
          if (message.params && message.params.result) {
            const accountInfo = message.params.result.value;
            const newBalance = accountInfo.lamports / 1e9; // Convert to SOL

            // Initialize last balance on first update
            if (lastBalance === null) {
              lastBalance = newBalance;
              console.log(`💰 Current balance: ${newBalance.toFixed(6)} SOL`);
              return;
            }

            // Check if balance changed
            if (newBalance !== lastBalance) {
              const change = newBalance - lastBalance;
              const changeStr = change > 0 ? `+${change.toFixed(6)}` : change.toFixed(6);
              
              console.log(`\n🔔 Balance Changed!`);
              console.log(`   Previous: ${lastBalance.toFixed(6)} SOL`);
              console.log(`   Current:  ${newBalance.toFixed(6)} SOL`);
              console.log(`   Change:   ${changeStr} SOL`);
              console.log(`   Time:     ${new Date().toLocaleString()}`);
              console.log('');

              // Fire webhook
              await EventLogger.log(
                agentId,
                'balance_changed',
                'info',
                `Balance changed: ${changeStr} SOL (now ${newBalance.toFixed(6)} SOL)`,
                {
                  previous_balance: lastBalance,
                  current_balance: newBalance,
                  change: change,
                  currency: 'SOL',
                  timestamp: new Date().toISOString(),
                }
              );

              console.log('📤 Webhook sent to:', subscription.url);
              console.log('');

              lastBalance = newBalance;
            }
          }
        } catch (error) {
          console.error('Error processing message:', (error as Error).message);
        }
      });

      ws.on('error', (error: Error) => {
        console.error('\n❌ WebSocket error:', error.message);
      });

      ws.on('close', () => {
        console.log('\n⚠️  WebSocket connection closed');
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 Reconnecting in ${delay / 1000} seconds... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            // Restart the command (simple approach)
            process.exit(1);
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached. Please restart manually.');
          process.exit(1);
        }
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n\n📟 Stopping balance monitor...');
        ws.close();
        process.exit(0);
      });

    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
