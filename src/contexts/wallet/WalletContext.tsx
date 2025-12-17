import { createContext } from 'react';
import type { Chain } from '@xertraplatform/wormhole-sdk';
import type {
  TransferWallet,
  Wallet,
  WormholeConnectWalletProvider,
} from 'utils/wallet';

export interface WalletContextType {
  connectWallet: (
    chain: Chain,
    type: TransferWallet,
    autoConnect?: boolean,
  ) => Promise<Wallet | null>;
  disconnectWallet: (chain: Chain, type: TransferWallet) => Promise<void>;
  swapWallets: () => void;
  walletProvider: WormholeConnectWalletProvider;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export default WalletContext;
