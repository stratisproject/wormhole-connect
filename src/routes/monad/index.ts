import type {
  ChainContext,
  Network,
  routes,
  TokenId,
} from '@xertraplatform/wormhole-sdk';
import type { MultiTokenNttRoute } from '@xertraplatform/wormhole-sdk-route-ntt';
import {
  MultiTokenNttExecutorRoute,
  MultiTokenNttManualRoute,
} from '@xertraplatform/wormhole-sdk-route-ntt';
import { isTokenSupported } from './utils';

import '@xertraplatform/wormhole-sdk-definitions-ntt';
import '@xertraplatform/wormhole-sdk-evm-ntt';

export function monadBridgeExecutorRoute(
  config: MultiTokenNttExecutorRoute.Config,
): routes.RouteConstructor {
  class ConfigurableMonadBridgeExecutorRoute<N extends Network>
    extends MultiTokenNttExecutorRoute<N>
    implements
      routes.StaticRouteMethods<typeof ConfigurableMonadBridgeExecutorRoute>
  {
    static meta = {
      name: 'MonadBridgeExecutorRoute',
    };

    static override config: MultiTokenNttExecutorRoute.Config = config;

    static override async supportedDestinationTokens<N extends Network>(
      sourceToken: TokenId,
      fromChain: ChainContext<N>,
      toChain: ChainContext<N>,
    ): Promise<TokenId[]> {
      const isSupported = isTokenSupported(sourceToken, fromChain);
      if (!isSupported) {
        return [];
      }

      return super.supportedDestinationTokens(sourceToken, fromChain, toChain);
    }
  }

  return ConfigurableMonadBridgeExecutorRoute;
}

export function monadBridgeManualRoute(
  config: MultiTokenNttRoute.Config,
): routes.RouteConstructor {
  class ConfigurableMonadBridgeManualRoute<N extends Network>
    extends MultiTokenNttManualRoute<N>
    implements
      routes.StaticRouteMethods<typeof ConfigurableMonadBridgeManualRoute>
  {
    static meta = {
      name: 'MonadBridgeManualRoute',
    };

    static override config: MultiTokenNttRoute.Config = config;

    static override async supportedDestinationTokens<N extends Network>(
      sourceToken: TokenId,
      fromChain: ChainContext<N>,
      toChain: ChainContext<N>,
    ): Promise<TokenId[]> {
      const isSupported = isTokenSupported(sourceToken, fromChain);
      if (!isSupported) {
        return [];
      }

      return super.supportedDestinationTokens(sourceToken, fromChain, toChain);
    }
  }

  return ConfigurableMonadBridgeManualRoute;
}

export * from './consts';
export * from './utils';
