import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SolanaClient } from '../../utils/solana';
import { FileSystemStorage } from '../../core/storage/filesystem';
import { PublicKey, Cluster } from '@solana/web3.js';
import { JupiterClient } from '../../integrations/jupiter/client';
import Table from 'cli-table3';

export const tokensCommand = new Command('tokens')
  .description('📟 List all tokens in wallet')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .option('--network <network>', 'Network to use (overrides config)')
  .action(async (agentIdArg, options) => {
    try {
      // Support both positional and flag syntax
      const agentId = agentIdArg || options.agentId;
      
      if (!agentId) {
        console.error('\n❌ Error: Agent ID is required');
        console.log('\nUsage: paw tokens <agent-id>');
        console.log('   or: paw tokens --agent-id <agent-id>');
        console.log('');
        process.exit(1);
      }

      // Use network from options or fall back to config
      const config = await FileSystemStorage.loadConfig(agentId);
      const network = options.network || config.network || 'mainnet-beta';

      console.log('\n📟 PAW - Token Balances');
      console.log('Agent ID:', agentId);
      console.log('Network: ', network);
      console.log('');

      const walletInfo = await WalletManager.getWalletInfo(agentId);
      const connection = SolanaClient.getConnection(network as Cluster, config.rpcUrl);
      const publicKey = new PublicKey(walletInfo.address);

      // Get SOL balance
      const solBalance = await connection.getBalance(publicKey);
      const solBalanceFormatted = (solBalance / 1e9).toFixed(9);

      // Get SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      // Create table
      const table = new Table({
        head: ['Token', 'Symbol', 'Balance', 'Decimals', 'Mint Address'],
        colWidths: [15, 10, 20, 10, 25],
        style: {
          head: ['cyan'],
          border: ['gray'],
        },
      });

      // Add SOL first
      table.push(['Solana', 'SOL', solBalanceFormatted, '9', 'Native']);

      // Add SPL tokens
      if (tokenAccounts.value.length === 0) {
        console.log('SOL Balance:', solBalanceFormatted, 'SOL');
        console.log('\nNo SPL tokens found.');
        console.log('');
        return;
      }

      // Collect all mints
      const mints: string[] = [];
      const tokenData: Array<{ mint: string; balance: number; decimals: number }> = [];

      for (const accountInfo of tokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mint = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount || 0;
        const decimals = parsedInfo.tokenAmount.decimals;

        mints.push(mint);
        tokenData.push({ mint, balance, decimals });
      }

      // Fetch metadata from DexScreener
      const metadata = await JupiterClient.getTokenMetadata(mints);

      // Known tokens fallback
      const knownTokens: { [key: string]: { name: string; symbol: string } } = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { name: 'USD Coin', symbol: 'USDC' },
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { name: 'Tether USD', symbol: 'USDT' },
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { name: 'Bonk', symbol: 'BONK' },
        'So11111111111111111111111111111111111111112': { name: 'Wrapped SOL', symbol: 'wSOL' },
      };

      // Add tokens to table
      for (const token of tokenData) {
        let name = 'Unknown Token';
        let symbol = 'UNKNOWN';

        // Try DexScreener metadata first
        if (metadata[token.mint]) {
          name = metadata[token.mint].name;
          symbol = metadata[token.mint].symbol;
        }
        // Fallback to known tokens
        else if (knownTokens[token.mint]) {
          name = knownTokens[token.mint].name;
          symbol = knownTokens[token.mint].symbol;
        }

        const shortMint = `${token.mint.slice(0, 8)}...${token.mint.slice(-8)}`;
        table.push([name, symbol, token.balance.toFixed(token.decimals), token.decimals.toString(), shortMint]);
      }

      console.log(table.toString());
      console.log('');
      console.log(`Total tokens: ${tokenAccounts.value.length + 1} (including SOL)`);
      console.log('');
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
