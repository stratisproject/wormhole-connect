import type { routes } from '@xertraplatform/wormhole-sdk';

import '@xertraplatform/wormhole-sdk-definitions-ntt';
import '@xertraplatform/wormhole-sdk-evm-ntt';
import '@xertraplatform/wormhole-sdk-solana-ntt';
import '@xertraplatform/wormhole-sdk-sui-ntt';

import type { NttRoute } from '@xertraplatform/wormhole-sdk-route-ntt';
import {
  nttAutomaticRoute,
  type NttExecutorRoute,
  nttExecutorRoute,
  nttManualRoute,
} from '@xertraplatform/wormhole-sdk-route-ntt';

// Convenience function for integrators when adding NTT routes to their config
//
// Example:
//
// routes: [
//   ...DEFAULT_ROUTES,
//   ...nttRoutes({ ... }),
// ]
const nttRoutes = (
  nc: NttRoute.Config,
  executorOptions?: Omit<NttExecutorRoute.Config, 'ntt'>,
): routes.RouteConstructor[] => {
  return [
    nttManualRoute(nc) as routes.RouteConstructor,
    nttAutomaticRoute(nc) as routes.RouteConstructor,
    nttExecutorRoute({
      ntt: nc,
      ...executorOptions,
    }) as routes.RouteConstructor,
  ];
};

export {
  nttAutomaticRoute,
  nttExecutorRoute,
  nttManualRoute,
  nttRoutes,
  NttRoute,
  NttExecutorRoute,
};
