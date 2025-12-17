import type { Network } from '@xertraplatform/wormhole-sdk-base';
import type { routes } from '@xertraplatform/wormhole-sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import { MayanProtocol } from './types';

export class MayanRouteSWIFT<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteSWIFT>
{
  static meta = {
    name: 'MayanSwapSWIFT',
    provider: 'Mayan Swift',
  };

  override protocols: MayanProtocol[] = [MayanProtocol.SWIFT];
}
