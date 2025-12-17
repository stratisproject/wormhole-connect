import type { Network } from '@xertraplatform/wormhole-sdk-base';
import type { routes } from '@xertraplatform/wormhole-sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import { MayanProtocol } from './types';

export class MayanRouteWH<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteWH>
{
  static meta = {
    name: 'MayanSwapWH',
    provider: 'Mayan WH',
  };

  override protocols: MayanProtocol[] = [MayanProtocol.WH];
}
