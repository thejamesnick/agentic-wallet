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
  private static readonly API_BASE = 'https://lite-api.jup.ag/ultra/v1';
  private static readonly TOKEN_API = 'https://lite-api.jup.ag/tokens/v2';
  private static readonly PRICE_API = 'https://api.jup.ag/price/v2';
  private static tokenListCache: Map<string, any> | null = null;

  /**
   * Get list of all tokens supported by Jupiter
   */
  static async getTokenList(): Promise<any[]> {
    const response = await fetch(`${JupiterClient.TOKEN_API}/search?query=`);

    if (!response.ok) {
      throw new Error(`Jupiter token list error: ${response.statusText}`);
    }

    return (await response.json()) as any[];
  }

  /**
   * Search for a token by symbol or address
   */
  static async findToken(symbolOrAddress: string): Promise<any | null> {
    // Search using the new API
    const response = await fetch(
      `${JupiterClient.TOKEN_API}/search?query=${encodeURIComponent(symbolOrAddress)}`
    );

    if (!response.ok) {
      return null;
    }

    const tokens = (await response.json()) as any[];
    
    if (!tokens || tokens.length === 0) {
      return null;
    }

    // Find exact match by symbol or id (address)
    const exactMatch = tokens.find(
      (t: any) =>
        t.symbol?.toUpperCase() === symbolOrAddress.toUpperCase() ||
        t.id === symbolOrAddress
    );

    // Return exact match or first result, normalizing to use 'address' field
    const token = exactMatch || tokens[0];
    if (token && !token.address && token.id) {
      token.address = token.id; // Normalize: add 'address' field from 'id'
    }

    return token;
  }

  /**
   * Get a quote for swapping tokens (with optional referral fee)
   */
  static async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50,
    options?: {
      userPublicKey?: string;
      referralAccount?: string;
      referralFee?: number; // in basis points (bps)
    }
  ): Promise<any> {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });

    // Add optional parameters for referral fees
    if (options?.userPublicKey) {
      params.append('taker', options.userPublicKey);
    }
    if (options?.referralAccount) {
      params.append('referralAccount', options.referralAccount);
    }
    if (options?.referralFee) {
      params.append('referralFee', options.referralFee.toString());
    }

    const response = await fetch(`${JupiterClient.API_BASE}/order?${params}`);

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get swap transaction
   */
  static async getSwapTransaction(
    quote: QuoteResponse,
    userPublicKey: string,
    priorityFeeLamports?: number
  ): Promise<string> {
    const swapRequest: SwapRequest = {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: priorityFeeLamports || ('auto' as any),
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
   * Execute a swap using Ultra API
   */
  static async executeSwap(
    orderResponse: any,
    keypair: any
  ): Promise<{ signature: string; status: string }> {
    if (!orderResponse.transaction || orderResponse.transaction === "") {
      throw new Error("Jupiter failed to build the transaction. Check if you have sufficient balance and the correct token decimals.");
    }

    // Deserialize and sign transaction
    const transactionBuf = Buffer.from(orderResponse.transaction, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuf);
    transaction.sign([keypair]);

    // Serialize signed transaction
    const signedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    // Execute via Ultra API
    const response = await fetch(`${JupiterClient.API_BASE}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signedTransaction,
        requestId: orderResponse.requestId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Jupiter execute error: ${response.statusText}`);
    }

    const result = (await response.json()) as { signature: string; status: string };
    return result;
  }

  /**
   * Load referral configuration (FOUNDER'S referral account)
   * This is hardcoded so the founder earns on all swaps
   */
  static loadReferralConfig(): { referralAccount: string; referralFee: number } | null {
    // HARDCODED: Founder's referral account - YOU earn on every swap! 💰
    const FOUNDER_REFERRAL_ACCOUNT = '2WutJ7mKajims4WiFDHwR4vbF6pYjwq8kL4K6H9he1pr';
    const FOUNDER_REFERRAL_FEE = 100; // 1% fee (you keep 0.8%, Jupiter takes 0.2%)

    return {
      referralAccount: FOUNDER_REFERRAL_ACCOUNT,
      referralFee: FOUNDER_REFERRAL_FEE,
    };
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

  /**
   * Get token metadata (name, symbol) from DexScreener
   * @param mints Array of mint addresses
   */
  static async getTokenMetadata(mints: string[]): Promise<Record<string, { name: string; symbol: string }>> {
    try {
      if (mints.length === 0) return {};

      const metadata: Record<string, { name: string; symbol: string }> = {};

      // Process in chunks of 30
      const chunks = [];
      for (let i = 0; i < mints.length; i += 30) {
        chunks.push(mints.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const addresses = chunk.join(',');
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${addresses}`
        );

        if (!response.ok) {
          continue;
        }

        const data = (await response.json()) as any;
        
        if (data && data.pairs && Array.isArray(data.pairs)) {
          for (const pair of data.pairs) {
            const baseToken = pair.baseToken;
            if (baseToken && baseToken.address && chunk.includes(baseToken.address)) {
              metadata[baseToken.address] = {
                name: baseToken.name || 'Unknown Token',
                symbol: baseToken.symbol || 'UNKNOWN',
              };
            }
          }
        }
      }

      return metadata;
    } catch (error) {
      return {};
    }
  }

  /**
   * Get token price in USD using DexScreener (free, no auth required)
   * @param mints Array of mint addresses
   */
  static async getTokenPrices(mints: string[]): Promise<Record<string, number>> {
    try {
      if (mints.length === 0) return {};

      const prices: Record<string, number> = {};

      // DexScreener allows batch requests with comma-separated addresses
      // But we'll do it in chunks of 30 to be safe
      const chunks = [];
      for (let i = 0; i < mints.length; i += 30) {
        chunks.push(mints.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const addresses = chunk.join(',');
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${addresses}`
        );

        if (!response.ok) {
          console.warn(`DexScreener API error: ${response.statusText}`);
          continue;
        }

        const data = (await response.json()) as any;
        
        if (data && data.pairs && Array.isArray(data.pairs)) {
          // Group pairs by token address and get the most liquid pair
          const tokenPairs: Record<string, any[]> = {};
          
          for (const pair of data.pairs) {
            const baseToken = pair.baseToken?.address;
            if (baseToken && chunk.includes(baseToken)) {
              if (!tokenPairs[baseToken]) {
                tokenPairs[baseToken] = [];
              }
              tokenPairs[baseToken].push(pair);
            }
          }

          // For each token, use the pair with highest liquidity
          for (const [mint, pairs] of Object.entries(tokenPairs)) {
            if (pairs.length > 0) {
              // Sort by liquidity (USD) and take the highest
              const bestPair = pairs.sort((a, b) => {
                const liqA = parseFloat(a.liquidity?.usd || '0');
                const liqB = parseFloat(b.liquidity?.usd || '0');
                return liqB - liqA;
              })[0];

              const price = parseFloat(bestPair.priceUsd || '0');
              if (price > 0) {
                prices[mint] = price;
              }
            }
          }
        }
      }

      return prices;
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      return {};
    }
  }
}
