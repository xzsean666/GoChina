import { Hono } from 'hono';
import { createWalletClient, http, parseAbi, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygonAmoy } from 'viem/chains';
import type { Env } from '../index.js';

const DEFAULT_FAUCET_KEY =
  '0xa010561d0ee36587adb4c9d81f4d19d84dc8b2246a9b7b8fd0665d1f8b15d844';

const TOKENS = {
  USDC: {
    symbol: 'USDC',
    address: '0xc252a473DC466de3799149A2616ccc625832F40C' as `0x${string}`,
    decimals: 6,
    claimAmountRaw: 100_000_000n, // 100 USDC
    claimAmountDisplay: '100',
  },
  USDT: {
    symbol: 'USDT',
    address: '0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31' as `0x${string}`,
    decimals: 6,
    claimAmountRaw: 100_000_000n, // 100 USDT
    claimAmountDisplay: '100',
  },
  POL: {
    symbol: 'POL',
    decimals: 18,
    claimAmountWei: parseEther('0.1'), // 0.1 POL
    claimAmountDisplay: '0.1',
  },
};

const RPC_ENDPOINTS = [
  'https://polygon-amoy-bor-rpc.publicnode.com',
  'https://polygon-amoy.drpc.org',
  'https://api.zan.top/polygon-amoy',
];

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function faucet()',
]);

export function createFaucetController(env: Env) {
  const router = new Hono();

  router.get('/info', (c) => {
    return c.json({
      status: 'ok',
      network: {
        name: 'Polygon Amoy Testnet',
        chainId: 80002,
        currency: 'POL',
        explorer: 'https://amoy.polygonscan.com',
      },
      tokens: [
        {
          symbol: TOKENS.USDC.symbol,
          address: TOKENS.USDC.address,
          decimals: TOKENS.USDC.decimals,
          claimAmount: TOKENS.USDC.claimAmountDisplay,
        },
        {
          symbol: TOKENS.USDT.symbol,
          address: TOKENS.USDT.address,
          decimals: TOKENS.USDT.decimals,
          claimAmount: TOKENS.USDT.claimAmountDisplay,
        },
        {
          symbol: TOKENS.POL.symbol,
          decimals: TOKENS.POL.decimals,
          claimAmount: TOKENS.POL.claimAmountDisplay,
        },
      ],
      payerAddress: '0x285bd8C75C7647b7da1C1154776633804d4ff5eC',
      externalFaucets: [
        { name: 'Polygon Official Faucet', url: 'https://faucet.polygon.technology/' },
        { name: 'Alchemy Amoy Faucet', url: 'https://www.alchemy.com/faucets/polygon-amoy' },
      ],
    });
  });

  router.post('/claim', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const recipient = body.address as string;
      const symbol = (body.symbol || 'USDC').toUpperCase() as 'USDC' | 'USDT' | 'POL';

      if (!recipient || !recipient.startsWith('0x') || recipient.length !== 42) {
        return c.json(
          {
            error: {
              code: 'INVALID_ADDRESS',
              message: 'Invalid EVM wallet address. Must be 0x-prefixed 42-character hex.',
            },
          },
          400
        );
      }

      if (!['USDC', 'USDT', 'POL'].includes(symbol)) {
        return c.json(
          {
            error: {
              code: 'UNSUPPORTED_TOKEN',
              message: 'Supported faucet tokens are USDC, USDT, and POL.',
            },
          },
          400
        );
      }

      const rawKey = (env.FAUCET_PRIVATE_KEY || DEFAULT_FAUCET_KEY).trim();
      const privateKey = (
        rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`
      ) as `0x${string}`;

      const account = privateKeyToAccount(privateKey);

      let txHash = '';
      let rpcIndex = 0;
      let lastError: any = null;

      // Failover across RPC endpoints
      for (const rpcUrl of RPC_ENDPOINTS) {
        try {
          const client = createWalletClient({
            account,
            chain: polygonAmoy,
            transport: http(rpcUrl, { timeout: 10000 }),
          });

          if (symbol === 'POL') {
            txHash = await client.sendTransaction({
              to: recipient as `0x${string}`,
              value: TOKENS.POL.claimAmountWei,
            });
          } else {
            const tokenMeta = TOKENS[symbol];
            txHash = await client.writeContract({
              address: tokenMeta.address,
              abi: ERC20_ABI,
              functionName: 'transfer',
              args: [recipient as `0x${string}`, tokenMeta.claimAmountRaw],
            });
          }
          break; // Succeeded!
        } catch (err) {
          lastError = err;
          rpcIndex++;
        }
      }

      if (!txHash) {
        return c.json(
          {
            error: {
              code: 'CLAIM_FAILED',
              message: `Failed to broadcast transaction on Amoy RPCs: ${lastError?.message || lastError}`,
            },
          },
          500
        );
      }

      return c.json({
        status: 'ok',
        symbol,
        amount: symbol === 'POL' ? TOKENS.POL.claimAmountDisplay : TOKENS[symbol].claimAmountDisplay,
        recipient,
        txHash,
        explorerUrl: `https://amoy.polygonscan.com/tx/${txHash}`,
      });
    } catch (err: any) {
      return c.json(
        {
          error: {
            code: 'FAUCET_INTERNAL_ERROR',
            message: err?.message || String(err),
          },
        },
        500
      );
    }
  });

  return router;
}
