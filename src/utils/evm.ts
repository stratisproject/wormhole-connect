import type { Chain } from '@xertraplatform/wormhole-sdk';
import { chainToPlatform } from '@xertraplatform/wormhole-sdk';

export function isEvmChain(chain: Chain): boolean {
  return chainToPlatform.has(chain) && chainToPlatform.get(chain) === 'Evm';
}
