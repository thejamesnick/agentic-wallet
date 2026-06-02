import { Connection, clusterApiUrl, Cluster } from '@solana/web3.js';

export class SolanaClient {
  private static connections: Map<string, Connection> = new Map();
  private static HELIUS_API_KEY = '2452c60f-ab21-4a80-b486-30f0aca63d2f';

  /**
   * Get RPC endpoint with Helius as primary and fallback to default
   */
  private static getEndpoint(network: Cluster): string {
    // 1. Prioritize network-specific environment variables
    if (network === 'mainnet-beta' && process.env.SOLANA_RPC_URL_MAINNET) {
      return process.env.SOLANA_RPC_URL_MAINNET;
    }
    if (network === 'devnet' && process.env.SOLANA_RPC_URL_DEVNET) {
      return process.env.SOLANA_RPC_URL_DEVNET;
    }

    // 2. Prioritize general environment variable for RPC URL
    if (process.env.SOLANA_RPC_URL) {
      return process.env.SOLANA_RPC_URL;
    }

    // 2. Use Helius if API key is available (env override or default key)
    const apiKey = process.env.HELIUS_API_KEY || this.HELIUS_API_KEY;
    if (apiKey) {
      if (network === 'mainnet-beta') {
        return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
      } else if (network === 'devnet') {
        return `https://devnet.helius-rpc.com/?api-key=${apiKey}`;
      }
    }

    // 3. Fallback to default Solana RPC
    return clusterApiUrl(network);
  }

  /**
   * Get or create a connection to Solana
   */
  static getConnection(
    network: Cluster = 'mainnet-beta',
    customRpcUrl?: string
  ): Connection {
    const endpoint = customRpcUrl || this.getEndpoint(network);
    const cacheKey = `${network}-${endpoint}`;

    if (!SolanaClient.connections.has(cacheKey)) {
      const connection = new Connection(endpoint, 'confirmed');
      SolanaClient.connections.set(cacheKey, connection);
    }

    return SolanaClient.connections.get(cacheKey)!;
  }

  /**
   * Clear cached connections (useful for switching RPC providers)
   */
  static clearConnections(): void {
    SolanaClient.connections.clear();
  }

  /**
   * Get SOL balance for an address
   */
  static async getBalance(
    address: string,
    network: Cluster = 'mainnet-beta',
    customRpcUrl?: string
  ): Promise<number> {
    const connection = SolanaClient.getConnection(network, customRpcUrl);
    const publicKey = new (await import('@solana/web3.js')).PublicKey(
      address
    );
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  /**
   * Get explorer URL for transaction or address
   * Uses Solscan for mainnet, Solana Explorer for devnet/testnet
   */
  static getExplorerUrl(
    type: 'tx' | 'address',
    value: string,
    network: Cluster = 'mainnet-beta'
  ): string {
    if (network === 'mainnet-beta') {
      // Use Solscan for mainnet
      if (type === 'tx') {
        return `https://solscan.io/tx/${value}`;
      } else {
        return `https://solscan.io/address/${value}`;
      }
    } else {
      // Use Solana Explorer for devnet/testnet
      if (type === 'tx') {
        return `https://explorer.solana.com/tx/${value}?cluster=${network}`;
      } else {
        return `https://explorer.solana.com/address/${value}?cluster=${network}`;
      }
    }
  }
}
