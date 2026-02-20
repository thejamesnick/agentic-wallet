import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

interface SwapRequest {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number;
}

export class JupiterClient {
  private static readonly API_BASE = 'https://quote-api.jup.ag/v6';
  private static tokenListCache: Map<string, any> | null = null;

  /**
   * Get list of all tokens supported by Jupiter
   */
  static async getTokenList(): Promise<any[]> {
    const response = await fetch('https://token.jup.ag/all');

    if (!response.ok) {
      throw new Error(`Jupiter token list error: ${response.statusText}`);
    }

    return (await response.json()) as any[];
  }

  /**
   * Search for a token by symbol or address
   */
  static async findToken(symbolOrAddress: string): Promise<any | null> {
    // Load token list if not cached
    if (!JupiterClient.tokenListCache) {
      const tokens = await JupiterClient.getTokenList();
      JupiterClient.tokenListCache = new Map();
      tokens.forEach((token) => {
        JupiterClient.tokenListCache!.set(token.address, token);
        JupiterClient.tokenListCache!.set(token.symbol.toUpperCase(), token);
      });
    }

    return JupiterClient.tokenListCache.get(symbolOrAddress.toUpperCase()) || null;
  }

  /**
   * Get a quote for swapping tokens
   */
  static async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50
  ): Promise<QuoteResponse> {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });

    const response = await fetch(`${JupiterClient.API_BASE}/quote?${params}`);

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }

    return (await response.json()) as QuoteResponse;
  }

  /**
   * Get swap transaction
   */
  static async getSwapTransaction(
    quote: QuoteResponse,
    userPublicKey: string
  ): Promise<string> {
    const swapRequest: SwapRequest = {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto' as any,
    };

    const response = await fetch(`${JupiterClient.API_BASE}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapRequest),
    });

    if (!response.ok) {
      throw new Error(`Jupiter swap error: ${response.statusText}`);
    }

    const result = (await response.json()) as { swapTransaction: string };
    return result.swapTransaction;
  }

  /**
   * Execute a swap
   */
  static async executeSwap(
    connection: Connection,
    swapTransactionBase64: string,
    keypair: any
  ): Promise<string> {
    // Deserialize transaction
    const swapTransactionBuf = Buffer.from(swapTransactionBase64, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // Sign transaction
    transaction.sign([keypair]);

    // Send transaction
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });

    // Confirm transaction
    await connection.confirmTransaction(txid, 'confirmed');

    return txid;
  }

  /**
   * Common token addresses on Solana
   */
  static readonly TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  };
}
