import { create } from 'zustand';

interface WalletState {
  address: string | null;
  safeAddress: string | null;
  isConnected: boolean;
  isInitialized: boolean;
}

interface TradeState {
  selectedOutcome: 'YES' | 'NO';
  orderType: 'buy' | 'sell';
  limitPrice: string;
  shares: string;
}

interface SessionState {
  clobClient: any | null;
  isReady: boolean;
  error: string | null;
}

interface TradeStore {
  wallet: WalletState;
  trade: TradeState;
  session: SessionState;

  // Wallet actions
  setWallet: (wallet: Partial<WalletState>) => void;
  resetWallet: () => void;

  // Trade actions
  setOutcome: (outcome: 'YES' | 'NO') => void;
  setSide: (orderType: 'buy' | 'sell') => void;
  setPrice: (price: string) => void;
  setShares: (shares: string) => void;
  resetTrade: () => void;

  // Session actions
  setSession: (session: Partial<SessionState>) => void;
  resetSession: () => void;

  // Full reset
  reset: () => void;
}

const initialWallet: WalletState = {
  address: null,
  safeAddress: null,
  isConnected: false,
  isInitialized: false,
};

const initialTrade: TradeState = {
  selectedOutcome: 'YES',
  orderType: 'buy',
  limitPrice: '',
  shares: '',
};

const initialSession: SessionState = {
  clobClient: null,
  isReady: false,
  error: null,
};

export const useTradeStore = create<TradeStore>((set) => ({
  wallet: initialWallet,
  trade: initialTrade,
  session: initialSession,

  setWallet: (wallet) =>
    set((state) => ({ wallet: { ...state.wallet, ...wallet } })),
  resetWallet: () => set({ wallet: initialWallet }),

  setOutcome: (selectedOutcome) =>
    set((state) => ({ trade: { ...state.trade, selectedOutcome } })),
  setSide: (orderType) =>
    set((state) => ({ trade: { ...state.trade, orderType } })),
  setPrice: (limitPrice) =>
    set((state) => ({ trade: { ...state.trade, limitPrice } })),
  setShares: (shares) =>
    set((state) => ({ trade: { ...state.trade, shares } })),
  resetTrade: () => set({ trade: initialTrade }),

  setSession: (session) =>
    set((state) => ({ session: { ...state.session, ...session } })),
  resetSession: () => set({ session: initialSession }),

  reset: () => set({ wallet: initialWallet, trade: initialTrade, session: initialSession }),
}));
