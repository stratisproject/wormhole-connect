import type { NetworkData } from 'config/types';
import { MAINNET_CHAINS } from './chains';
import { MAINNET_RPC_MAPPING } from './rpcs';
import { MAINNET_TOKENS } from './tokens';
import { MAINNET_WRAPPED_TOKENS } from './wrappedTokens';

export * from './chains';
export * from './rpcs';
export * from './tokens';

const MAINNET: NetworkData = {
  chains: MAINNET_CHAINS,
  tokens: MAINNET_TOKENS,
  wrappedTokens: MAINNET_WRAPPED_TOKENS,
  rpcs: MAINNET_RPC_MAPPING,
  guardianSet: {
    index: 0,
    keys: ['0xE38331EE9C9717EC7C5861b20D95A7dD5A8187cd'],
  },
};

export default MAINNET;
