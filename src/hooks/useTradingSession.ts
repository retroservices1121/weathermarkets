'use client';

import { useState, useCallback, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';
import { RelayClient } from '@polymarket/builder-relayer-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
// These are not re-exported from the main index, import from subpaths
// @ts-ignore - subpath import
import { deriveSafe } from '@polymarket/builder-relayer-client/dist/builder/derive';
// @ts-ignore - subpath import
import { getContractConfig } from '@polymarket/builder-relayer-client/dist/config';
import {
  POLYGON_CHAIN_ID,
  CLOB_HOST,
  RELAYER_URL,
  USDC_E,
  CTF_EXCHANGE,
  NEG_RISK_CTF_EXCHANGE,
  CONDITIONAL_TOKENS,
} from '@/lib/constants';
import { useTradeStore } from '@/store/useTradeStore';

// ERC20 approve ABI fragment
const ERC20_ABI = ['function approve(address spender, uint256 amount) external returns (bool)'];
const MAX_APPROVAL = ethers.constants.MaxUint256;

interface TradingSession {
  isReady: boolean;
  isInitializing: boolean;
  safeAddress: string | null;
  clobClient: ClobClient | null;
  error: string | null;
  initialize: () => Promise<void>;
}

export function useTradingSession(): TradingSession {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { setWallet, setSession } = useTradeStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [safeAddress, setSafeAddress] = useState<string | null>(null);
  const [clobClient, setClobClient] = useState<ClobClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const initialize = useCallback(async () => {
    if (!authenticated || !wallets.length || initRef.current) return;
    initRef.current = true;
    setIsInitializing(true);
    setError(null);

    try {
      // Step 1: Get Privy embedded wallet and convert to ethers v5 signer
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === 'privy'
      ) || wallets[0];

      if (!embeddedWallet) {
        throw new Error('No wallet found');
      }

      const address = embeddedWallet.address;
      setWallet({ address, isConnected: true });

      // Get an ethers v5 provider/signer from the wallet
      // Privy wallets expose an EIP-1193 provider
      const eip1193Provider = await (embeddedWallet as any).getEthereumProvider();
      const ethersProvider = new ethers.providers.Web3Provider(eip1193Provider);
      const signer = ethersProvider.getSigner();

      // Step 2: Configure builder for remote signing via our API route
      const builderConfig = new BuilderConfig({
        remoteBuilderConfig: {
          url: '/api/polymarket/sign',
        },
      });

      // Step 3: Initialize RelayClient
      const relayClient = new RelayClient(
        RELAYER_URL,
        POLYGON_CHAIN_ID,
        signer,
        builderConfig
      );

      // Step 4: Derive Safe address from EOA
      const contractConfig = getContractConfig(POLYGON_CHAIN_ID);
      const safeAddr = deriveSafe(address, contractConfig.SafeContracts.SafeFactory);
      setSafeAddress(safeAddr);
      setWallet({ safeAddress: safeAddr });

      // Step 5: Check if Safe is deployed; deploy if needed (gasless)
      const isDeployed = await relayClient.getDeployed(safeAddr);
      if (!isDeployed) {
        const deployResponse = await relayClient.deploy();
        // Wait for deployment to be confirmed
        await deployResponse.wait();
      }

      // Step 6: Derive/create user API credentials
      // Use the signer to derive L2 HMAC credentials from the CLOB
      const tempClobClient = new ClobClient(
        CLOB_HOST,
        POLYGON_CHAIN_ID,
        signer,
        undefined, // no creds yet
        2, // SignatureType.POLY_GNOSIS_SAFE
        safeAddr
      );

      let creds;
      try {
        creds = await tempClobClient.deriveApiKey();
      } catch {
        creds = await tempClobClient.createApiKey();
      }

      // Step 7: Check token approvals; set all approvals if needed (gasless)
      const usdcInterface = new ethers.utils.Interface(ERC20_ABI);
      const ctfInterface = new ethers.utils.Interface([
        'function setApprovalForAll(address operator, bool approved) external',
      ]);

      // Build approval transactions
      const approvalTxns = [
        // USDC.e approval for CTF Exchange
        {
          to: USDC_E,
          data: usdcInterface.encodeFunctionData('approve', [CTF_EXCHANGE, MAX_APPROVAL]),
          value: '0',
        },
        // USDC.e approval for Neg Risk CTF Exchange
        {
          to: USDC_E,
          data: usdcInterface.encodeFunctionData('approve', [NEG_RISK_CTF_EXCHANGE, MAX_APPROVAL]),
          value: '0',
        },
        // CTF setApprovalForAll for CTF Exchange
        {
          to: CONDITIONAL_TOKENS,
          data: ctfInterface.encodeFunctionData('setApprovalForAll', [CTF_EXCHANGE, true]),
          value: '0',
        },
        // CTF setApprovalForAll for Neg Risk CTF Exchange
        {
          to: CONDITIONAL_TOKENS,
          data: ctfInterface.encodeFunctionData('setApprovalForAll', [NEG_RISK_CTF_EXCHANGE, true]),
          value: '0',
        },
      ];

      try {
        const approvalResponse = await relayClient.execute(approvalTxns);
        await approvalResponse.wait();
      } catch (approvalErr: any) {
        // Approvals may already be set, log but don't fail
        console.warn('Approval transaction warning:', approvalErr.message);
      }

      // Step 8: Initialize ClobClient with user creds + builder config
      const finalClobClient = new ClobClient(
        CLOB_HOST,
        POLYGON_CHAIN_ID,
        signer,
        creds,
        2, // SignatureType.POLY_GNOSIS_SAFE
        safeAddr,
        undefined, // geoBlockToken
        undefined, // useServerTime
        builderConfig
      );

      setClobClient(finalClobClient);
      setIsReady(true);
      setWallet({ isInitialized: true });
      setSession({ clobClient: finalClobClient, isReady: true, error: null });
    } catch (err: any) {
      console.error('Trading session initialization error:', err);
      const errorMsg = err.message || 'Failed to initialize trading session';
      setError(errorMsg);
      setSession({ error: errorMsg });
      initRef.current = false;
    } finally {
      setIsInitializing(false);
    }
  }, [authenticated, wallets, setWallet, setSession]);

  return {
    isReady,
    isInitializing,
    safeAddress,
    clobClient,
    error,
    initialize,
  };
}
