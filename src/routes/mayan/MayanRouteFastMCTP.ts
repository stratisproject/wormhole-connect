import type { routes } from '@xertraplatform/wormhole-sdk-connect';
import type { Network } from '@xertraplatform/wormhole-sdk-base';
import { MayanProtocol } from './types';
import { MayanRouteBase } from './MayanRouteBase';

export class MayanRouteFastMCTP<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteFastMCTP>
{
  static meta = {
    name: 'MayanSwapFastMCTP',
    provider: 'Mayan MCTP',
  };

  override protocols: MayanProtocol[] = [MayanProtocol.FAST_MCTP];
}
