import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SolanaClient } from '../../utils/solana';
import { FileSystemStorage } from '../../core/storage/filesystem';
import { Cluster } from '@solana/web3.js';
const blessed = require('blessed');

export const dashboardCommand = new Command('dashboard')
  .description('📟 Interactive pager-style dashboard')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .action(async (agentIdArg, options) => {
    try {
      // Support both positional and flag syntax
      const agentId = agentIdArg || options.agentId;
      
      if (!agentId) {
        console.error('\n❌ Error: Agent ID is required');
        console.log('\nUsage: paw dashboard <agent-id>');
        console.log('   or: paw dashboard --agent-id <agent-id>');
        console.log('');
        process.exit(1);
      }

      // Load wallet info
      const walletInfo = await WalletManager.getWalletInfo(agentId);
      const config = await FileSystemStorage.loadConfig(agentId);
      const network = config.network || 'devnet';

      // Create screen with pager aesthetic
      const screen = blessed.screen({
        smartCSR: true,
        title: '📟 PAW',
        fullUnicode: true,
      });

      // Main pager display - monochrome, simple
      const pagerBox = blessed.box({
        top: 'center',
        left: 'center',
        width: '80%',
        height: '80%',
        border: {
          type: 'line',
          fg: 'green',
        },
        style: {
          fg: 'green',
          bg: 'black',
          border: {
            fg: 'green',
          },
        },
        tags: true,
        scrollable: true,
        alwaysScroll: true,
        scrollbar: {
          ch: '█',
          style: {
            fg: 'green',
          },
        },
        keys: true,
        vi: true,
      });

      // Status bar at bottom
      const statusBar = blessed.box({
        bottom: 0,
        left: 0,
        width: '100%',
        height: 1,
        style: {
          fg: 'black',
          bg: 'green',
        },
        content: ' 📟 PAW | [R]efresh [Q]uit | Use ↑↓ to scroll',
      });

      screen.append(pagerBox);
      screen.append(statusBar);

      // Function to render pager content
      const renderPager = async () => {
        try {
          const connection = SolanaClient.getConnection(network as Cluster);
          
          // Get balance
          const balance = await connection.getBalance(walletInfo.publicKey);
          const solBalance = (balance / 1e9).toFixed(9);

          // Get transaction history
          const signatures = await connection.getSignaturesForAddress(
            walletInfo.publicKey,
            { limit: 8 }
          );

          // Build pager content (like old pager messages)
          let content = '';
          
          // Header
          content += '{bold}╔═══════════════════════════════════════════════════════════╗{/bold}\n';
          content += '{bold}║                    📟 POCKETAGENT WALLET                  ║{/bold}\n';
          content += '{bold}╚═══════════════════════════════════════════════════════════╝{/bold}\n';
          content += '\n';
          
          // Agent info
          content += `{green-fg}AGENT:{/green-fg} ${agentId}\n`;
          content += `{green-fg}ADDR:{/green-fg}  ${walletInfo.address.slice(0, 20)}...\n`;
          content += `{green-fg}NET:{/green-fg}   ${network.toUpperCase()}\n`;
          content += '\n';
          content += '───────────────────────────────────────────────────────────\n';
          content += '\n';

          // Balance (like pager notification)
          content += `{bold}💰 BALANCE:{/bold}\n`;
          content += `   ${solBalance} SOL\n`;
          content += '\n';
          content += '───────────────────────────────────────────────────────────\n';
          content += '\n';

          // Recent messages (transactions)
          content += `{bold}📬 RECENT MESSAGES ({${signatures.length}}):{/bold}\n`;
          content += '\n';

          if (signatures.length === 0) {
            content += '   No messages.\n';
          } else {
            for (let i = 0; i < signatures.length; i++) {
              const sig = signatures[i];
              const status = sig.err ? '✗' : '✓';
              const date = sig.blockTime
                ? new Date(sig.blockTime * 1000)
                : new Date();
              
              const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
              
              content += `   ${i + 1}. [${status}] ${dateStr} ${timeStr}\n`;
              content += `      ${sig.signature.slice(0, 16)}...\n`;
              if (i < signatures.length - 1) content += '\n';
            }
          }

          content += '\n';
          content += '───────────────────────────────────────────────────────────\n';
          content += '\n';
          content += `{gray-fg}Last updated: ${new Date().toLocaleTimeString()}{/gray-fg}\n`;

          pagerBox.setContent(content);
          screen.render();
        } catch (error) {
          pagerBox.setContent(
            '{red-fg}ERROR: Unable to fetch wallet data{/red-fg}\n\n' +
            'Press R to retry or Q to quit.'
          );
          screen.render();
        }
      };

      // Initial render
      await renderPager();

      // Keyboard shortcuts
      screen.key(['escape', 'q', 'Q', 'C-c'], () => {
        return process.exit(0);
      });

      screen.key(['r', 'R'], async () => {
        statusBar.setContent(' 📟 PAW | Refreshing... | Please wait');
        screen.render();
        await renderPager();
        statusBar.setContent(' 📟 PAW | [R]efresh [Q]uit | Use ↑↓ to scroll');
        screen.render();
      });

      // Focus on pager box for scrolling
      pagerBox.focus();

      // Auto-refresh every 30 seconds
      setInterval(async () => {
        await renderPager();
      }, 30000);

      // Render screen
      screen.render();

    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
