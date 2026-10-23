<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  Droplets,
  Wallet,
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  Copy,
  RefreshCw,
  Sparkles,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Coins,
} from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

const toast = useToast();

const AMOY_CHAIN_ID_HEX = '0x13882'; // 80002 in hex
const AMOY_CHAIN_ID_DEC = 80002;

const USDC_ADDRESS = '0xc252a473DC466de3799149A2616ccc625832F40C';
const USDT_ADDRESS = '0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31';

const isConnected = ref(false);
const walletAddress = ref('');
const currentChainId = ref<number | null>(null);

const polBalance = ref('0.00');
const usdcBalance = ref('0.00');
const usdtBalance = ref('0.00');
const isRefreshing = ref(false);

const customAddress = ref('');
const claimingToken = ref<string | null>(null);
const lastClaimTx = ref<{ symbol: string; hash: string } | null>(null);

const isAmoyNetwork = computed(() => currentChainId.value === AMOY_CHAIN_ID_DEC);

onMounted(() => {
  checkWalletConnection();
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length > 0) {
        walletAddress.value = accounts[0]!;
        isConnected.value = true;
        customAddress.value = accounts[0]!;
        refreshBalances();
      } else {
        isConnected.value = false;
        walletAddress.value = '';
      }
    });

    (window as any).ethereum.on('chainChanged', (chainIdHex: string) => {
      currentChainId.value = parseInt(chainIdHex, 16);
      refreshBalances();
    });
  }
});

async function checkWalletConnection() {
  if (typeof window === 'undefined' || !(window as any).ethereum) return;
  try {
    const ethereum = (window as any).ethereum;
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    currentChainId.value = parseInt(chainIdHex, 16);

    if (accounts && accounts.length > 0) {
      walletAddress.value = accounts[0];
      customAddress.value = accounts[0];
      isConnected.value = true;
      refreshBalances();
    }
  } catch (err) {
    console.error('Failed to check wallet connection:', err);
  }
}

async function connectWallet() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    toast.error('未检测到 Web3 钱包，请安装 MetaMask 或 OKX 钱包插件');
    return;
  }
  try {
    const ethereum = (window as any).ethereum;
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    currentChainId.value = parseInt(chainIdHex, 16);

    if (accounts && accounts.length > 0) {
      walletAddress.value = accounts[0];
      customAddress.value = accounts[0];
      isConnected.value = true;
      toast.success('钱包连接成功');

      if (!isAmoyNetwork.value) {
        await switchNetwork();
      }
      refreshBalances();
    }
  } catch (err: any) {
    toast.error(`连接失败: ${err.message || err}`);
  }
}

async function switchNetwork() {
  if (typeof window === 'undefined' || !(window as any).ethereum) return;
  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AMOY_CHAIN_ID_HEX }],
    });
    currentChainId.value = AMOY_CHAIN_ID_DEC;
    toast.success('已切换至 Polygon Amoy 测试网络');
  } catch (switchError: any) {
    // 4902: Unrecognized chain
    if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: AMOY_CHAIN_ID_HEX,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'POL',
                symbol: 'POL',
                decimals: 18,
              },
              rpcUrls: [
                'https://polygon-amoy-bor-rpc.publicnode.com',
                'https://polygon-amoy.drpc.org',
              ],
              blockExplorerUrls: ['https://amoy.polygonscan.com'],
            },
          ],
        });
        currentChainId.value = AMOY_CHAIN_ID_DEC;
        toast.success('已成功添加并切换至 Polygon Amoy 测试网络');
      } catch (addError: any) {
        toast.error(`添加网络失败: ${addError.message || addError}`);
      }
    } else {
      toast.error(`切换网络失败: ${switchError.message || switchError}`);
    }
  }
}

async function refreshBalances() {
  const target = walletAddress.value;
  if (!target || typeof window === 'undefined' || !(window as any).ethereum) return;

  isRefreshing.value = true;
  try {
    const ethereum = (window as any).ethereum;

    // 1. POL balance
    const polHex = await ethereum.request({
      method: 'eth_getBalance',
      params: [target, 'latest'],
    });
    const polWei = BigInt(polHex || '0x0');
    polBalance.value = (Number(polWei / 1000000000000n) / 1000000).toFixed(4);

    // 2. USDC balance
    const paddedAddr = target.toLowerCase().replace('0x', '').padStart(64, '0');
    const balanceOfData = '0x70a08231' + paddedAddr;

    const usdcHex = await ethereum.request({
      method: 'eth_call',
      params: [{ to: USDC_ADDRESS, data: balanceOfData }, 'latest'],
    });
    const usdcRaw = BigInt(usdcHex || '0x0');
    usdcBalance.value = (Number(usdcRaw) / 1e6).toFixed(2);

    // 3. USDT balance
    const usdtHex = await ethereum.request({
      method: 'eth_call',
      params: [{ to: USDT_ADDRESS, data: balanceOfData }, 'latest'],
    });
    const usdtRaw = BigInt(usdtHex || '0x0');
    usdtBalance.value = (Number(usdtRaw) / 1e6).toFixed(2);
  } catch (err) {
    console.error('Failed to query balances:', err);
  } finally {
    isRefreshing.value = false;
  }
}

// 免 Gas 快速领水（后端代发通道）
async function claimViaRelayer(symbol: 'USDC' | 'USDT' | 'POL') {
  const target = (customAddress.value || walletAddress.value).trim();
  if (!target || !target.startsWith('0x') || target.length !== 42) {
    toast.error('请输入有效的 0x 格式收款钱包地址');
    return;
  }

  claimingToken.value = symbol;
  try {
    const res = await fetch('/api/faucet/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: target, symbol }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || '领水请求失败');
    }

    lastClaimTx.value = {
      symbol,
      hash: data.txHash,
    };
    toast.success(`成功领取 ${data.amount} ${symbol}！交易已广播。`);

    setTimeout(refreshBalances, 3000);
    setTimeout(refreshBalances, 7000);
  } catch (err: any) {
    toast.error(`领水失败: ${err.message || err}`);
  } finally {
    claimingToken.value = null;
  }
}

// 钱包直接调用合约 faucet() 方法（需消耗微量 POL Gas，一次获取 1,000 枚）
async function claimDirectContract(symbol: 'USDC' | 'USDT') {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    toast.error('请先连接 Web3 钱包');
    return;
  }
  if (!isAmoyNetwork.value) {
    await switchNetwork();
    return;
  }

  const tokenAddress = symbol === 'USDC' ? USDC_ADDRESS : USDT_ADDRESS;
  claimingToken.value = `direct_${symbol}`;

  try {
    const ethereum = (window as any).ethereum;
    toast.info(`正在请求钱包签名调用 ${symbol} 铸币合约...`);

    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: walletAddress.value,
          to: tokenAddress,
          data: '0xde5f72fd', // faucet() selector
        },
      ],
    });

    lastClaimTx.value = {
      symbol: `${symbol} (1000枚)`,
      hash: txHash,
    };
    toast.success(`铸币交易已广播！Tx: ${txHash.slice(0, 10)}... 请等待区块确认`);

    setTimeout(refreshBalances, 4000);
    setTimeout(refreshBalances, 9000);
  } catch (err: any) {
    toast.error(`合约铸币失败: ${err.message || err}`);
  } finally {
    claimingToken.value = null;
  }
}

// 一键添加到钱包
async function watchAsset(symbol: 'USDC' | 'USDT') {
  if (typeof window === 'undefined' || !(window as any).ethereum) return;
  const isUsdc = symbol === 'USDC';
  const address = isUsdc ? USDC_ADDRESS : USDT_ADDRESS;

  try {
    const wasAdded = await (window as any).ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address,
          symbol,
          decimals: 6,
        },
      },
    });
    if (wasAdded) {
      toast.success(`${symbol} 已成功添加到钱包资产`);
    }
  } catch (err: any) {
    toast.error(`添加资产失败: ${err.message || err}`);
  }
}

function copyToClipboard(text: string, label = '内容') {
  navigator.clipboard.writeText(text);
  toast.success(`已复制 ${label}`);
}

function truncate(addr: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
</script>

<template>
  <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
    <!-- Header Title -->
    <div class="text-center space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <Flame class="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>Polygon Amoy Testnet (Chain ID 80002)</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-amber-600 to-amber-500 dark:from-white dark:via-amber-300 dark:to-yellow-400 bg-clip-text text-transparent">
        GoChina 开发者测试水龙头 (Dev Faucet)
      </h1>
      <p class="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        本环境用于在 Polygon Amoy 测试网体验 GoChina 服务的下单、USDC / USDT 加密结算与免 Gas 归集全流程。
        支持一键免 Gas 代发领水与智能合约直接铸币。
      </p>
    </div>

    <!-- Network Alert if Wrong Chain -->
    <div
      v-if="isConnected && !isAmoyNetwork"
      class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-amber-600 dark:text-amber-400 text-sm"
    >
      <div class="flex items-center gap-3">
        <AlertTriangle class="w-5 h-5 shrink-0" />
        <span>检测到您的钱包当前不在 <strong>Polygon Amoy</strong> 测试网（当前 Chain ID: {{ currentChainId }}）</span>
      </div>
      <button
        type="button"
        class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shrink-0"
        @click="switchNetwork"
      >
        一键切换到 Amoy
      </button>
    </div>

    <!-- Card 1: 钱包与资产状态 -->
    <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Wallet class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-display font-bold text-lg text-slate-900 dark:text-white">测试钱包账户</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">连接您的 Web3 钱包以查看实时余额并完成支付</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="isConnected"
            type="button"
            class="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            :disabled="isRefreshing"
            @click="refreshBalances"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
            <span>刷新余额</span>
          </button>

          <button
            v-if="!isConnected"
            type="button"
            class="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 transition-all"
            @click="connectWallet"
          >
            连接 Web3 钱包
          </button>
          <div
            v-else
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300"
          >
            <span>{{ truncate(walletAddress) }}</span>
            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="复制地址"
              @click="copyToClipboard(walletAddress, '钱包地址')"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- 资产余额三栏 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- POL -->
        <div class="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-1">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>原生代币 (Gas)</span>
            <span class="font-mono text-[10px] text-brand-500">Amoy Native</span>
          </div>
          <div class="text-2xl font-mono font-bold text-slate-900 dark:text-white">
            {{ polBalance }} <span class="text-xs text-slate-400 font-sans">POL</span>
          </div>
          <div class="text-[11px] text-slate-400">用于普通转账与合约调用的燃料</div>
        </div>

        <!-- USDC -->
        <div class="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-1">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>MockUSDC (EIP-3009)</span>
            <button
              type="button"
              class="text-[10px] text-cyan-500 hover:underline"
              @click="watchAsset('USDC')"
            >
              + 添加到钱包
            </button>
          </div>
          <div class="text-2xl font-mono font-bold text-cyan-600 dark:text-cyan-400">
            {{ usdcBalance }} <span class="text-xs text-slate-400 font-sans">USDC</span>
          </div>
          <div class="text-[11px] text-slate-400 truncate font-mono" :title="USDC_ADDRESS">
            合约: {{ truncate(USDC_ADDRESS) }}
          </div>
        </div>

        <!-- USDT -->
        <div class="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-1">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>MockUSDT (Polygon Meta-Tx)</span>
            <button
              type="button"
              class="text-[10px] text-emerald-500 hover:underline"
              @click="watchAsset('USDT')"
            >
              + 添加到钱包
            </button>
          </div>
          <div class="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {{ usdtBalance }} <span class="text-xs text-slate-400 font-sans">USDT</span>
          </div>
          <div class="text-[11px] text-slate-400 truncate font-mono" :title="USDT_ADDRESS">
            合约: {{ truncate(USDT_ADDRESS) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: 快捷领水操作台 (免 Gas 代发通道) -->
    <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
      <div class="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
          <Droplets class="w-5 h-5" />
        </div>
        <div>
          <h2 class="font-display font-bold text-lg text-slate-900 dark:text-white">免 Gas 快速领水 (Relayer 代发)</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            由平台测试总账钱包代付交易 Gas，用户钱包无需任何 POL 即可直接获赠测试代币！
          </p>
        </div>
      </div>

      <!-- 目标地址输入 -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          接收领水的 EVM 钱包地址
        </label>
        <div class="flex gap-2">
          <input
            v-model="customAddress"
            type="text"
            placeholder="0x..."
            class="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <button
            v-if="walletAddress"
            type="button"
            class="px-3.5 py-2 rounded-2xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            @click="customAddress = walletAddress"
          >
            填入当前钱包
          </button>
        </div>
      </div>

      <!-- 快速领取按钮阵列 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <button
          type="button"
          class="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-brand-500/10 border border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/10 transition-all flex flex-col items-center text-center gap-2 group"
          :disabled="claimingToken === 'USDC'"
          @click="claimViaRelayer('USDC')"
        >
          <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coins class="w-5 h-5" />
          </div>
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">领取 100 USDC</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400">免 Gas 直接转账</div>
          </div>
          <span v-if="claimingToken === 'USDC'" class="text-xs font-mono text-cyan-500 animate-pulse">正在广播...</span>
        </button>

        <button
          type="button"
          class="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-all flex flex-col items-center text-center gap-2 group"
          :disabled="claimingToken === 'USDT'"
          @click="claimViaRelayer('USDT')"
        >
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coins class="w-5 h-5" />
          </div>
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">领取 100 USDT</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400">免 Gas 直接转账</div>
          </div>
          <span v-if="claimingToken === 'USDT'" class="text-xs font-mono text-emerald-500 animate-pulse">正在广播...</span>
        </button>

        <button
          type="button"
          class="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all flex flex-col items-center text-center gap-2 group"
          :disabled="claimingToken === 'POL'"
          @click="claimViaRelayer('POL')"
        >
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Flame class="w-5 h-5" />
          </div>
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">领取 0.1 POL</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400">原生 Gas 燃料补充</div>
          </div>
          <span v-if="claimingToken === 'POL'" class="text-xs font-mono text-amber-500 animate-pulse">正在广播...</span>
        </button>
      </div>

      <!-- 成功广播哈希展示 -->
      <div
        v-if="lastClaimTx"
        class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>{{ lastClaimTx.symbol }} 领水成功！交易哈希: {{ truncate(lastClaimTx.hash) }}</span>
        </div>
        <a
          :href="`https://amoy.polygonscan.com/tx/${lastClaimTx.hash}`"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 font-semibold underline hover:text-emerald-500"
        >
          <span>在 Polygonscan 查看</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>
    </div>

    <!-- Card 3: 智能合约直连铸币 (适合已有 Gas 的用户) -->
    <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
      <div class="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h2 class="font-display font-bold text-lg text-slate-900 dark:text-white">智能合约直接铸造 (1,000 枚/次)</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            由您的钱包发起交易直接调用合约公开的 <code class="font-mono text-amber-500">faucet()</code> 函数，每次直接铸造 1,000 枚测试币。
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">USDC 铸币合约</div>
            <div class="text-xs text-slate-400 font-mono">0xc252...F40C</div>
          </div>
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-600/20 disabled:opacity-50"
            :disabled="!isConnected || claimingToken === 'direct_USDC'"
            @click="claimDirectContract('USDC')"
          >
            {{ claimingToken === 'direct_USDC' ? '签名中...' : '铸造 1,000 USDC' }}
          </button>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">USDT 铸币合约</div>
            <div class="text-xs text-slate-400 font-mono">0x2C2e...0B31</div>
          </div>
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
            :disabled="!isConnected || claimingToken === 'direct_USDT'"
            @click="claimDirectContract('USDT')"
          >
            {{ claimingToken === 'direct_USDT' ? '签名中...' : '铸造 1,000 USDT' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Card 4: 外部官方水龙头与资源导航 -->
    <div class="p-6 rounded-3xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-3">
      <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <ExternalLink class="w-4 h-4 text-brand-500" />
        <span>外部测试网资源与官方水龙头</span>
      </div>
      <div class="flex flex-wrap gap-4 text-xs font-medium">
        <a
          href="https://faucet.polygon.technology/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Polygon 官方水龙头 (POL)</span>
          <ExternalLink class="w-3 h-3" />
        </a>
        <a
          href="https://www.alchemy.com/faucets/polygon-amoy"
          target="_blank"
          rel="noopener noreferrer"
          class="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Alchemy Amoy Faucet</span>
          <ExternalLink class="w-3 h-3" />
        </a>
        <a
          href="https://amoy.polygonscan.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Polygonscan Amoy 区块浏览器</span>
          <ExternalLink class="w-3 h-3" />
        </a>
        <a
          href="https://pay3-frontend-test.pages.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="text-amber-500 hover:underline flex items-center gap-1"
        >
          <span>Pay3 原生测试收银台 (pay3-frontend-test.pages.dev)</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    </div>
  </div>
</template>
