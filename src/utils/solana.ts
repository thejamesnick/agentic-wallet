import { Connection, clusterApiUrl, Cluster } from '@solana/web3.js';

export class SolanaClient {
  private static connections: Map<string, Connection> = new Map();

  /**
   * Get or create a connection to Solana
   */
  static getConnection(network: Cluster = 'devnet'): Connection {
    if (!SolanaClient.connections.has(network)) {
      const endpoint = clusterApiUrl(network);
      const connection = new Connection(endpoint, 'confirmed');
      SolanaClient.connections.set(network, connection);
    }

    return SolanaClient.connections.get(network)!;
  }

  /**
   * Get SOL balance for an address
   */
  static async getBalance(
    address: string,
    network: Cluster = 'devnet'
  ): Promise<number> {
    const connection = SolanaClient.getConnection(network);
    const publicKey = new (await import('@solana/web3.js')).PublicKey(
      address
    );
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }
}
