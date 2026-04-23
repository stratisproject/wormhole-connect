import type { IProvider, Web3AuthOptions } from '@web3auth/modal';
import { Web3Auth } from '@web3auth/modal';
import type { ProviderRpcError } from 'viem';
import {
  toHex,
  getAddress,
  SwitchChainError,
  UserRejectedRequestError,
  UnsupportedChainIdError,
} from 'viem';
import type { Connector } from '@wagmi/core';
import {
  createConnector,
  ProviderNotFoundError,
  ChainNotConfiguredError,
} from '@wagmi/core';
import {
  PrimeSdk,
  Web3WalletProvider,
  EtherspotBundler,
} from '@etherspot/prime-sdk';

import type { EVMWalletConfig } from '@wormhole-labs/wallet-aggregator-evm';
import { EVMWallet } from '@wormhole-labs/wallet-aggregator-evm';
import type { Signer } from 'ethers';
import { BrowserProvider } from 'ethers';

export interface EtherspotOptions {
  chainId: number;
  rpcProviderUrl: string;
  bundlerUrl: string;
  bundlerApiKey: string;
  walletFactoryAddress: string;
  entryPointAddress: string;
}

export type Web3AuthConfig = Web3AuthOptions & {
  etherspotOptions?: EtherspotOptions;
};

const NAME = 'Web3Auth';
const ICON =
  'data:image/png;base64,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';

export class Web3AuthWallet extends EVMWallet<Web3AuthConfig> {
  constructor(config: EVMWalletConfig<Web3AuthConfig> = {}) {
    super({
      ...config,
      preferredChain: config.connectorOptions?.etherspotOptions?.chainId,
    });
  }

  getName() {
    return !this.connectorOptions?.etherspotOptions
      ? NAME
      : 'Web3Auth SmartAccount';
  }

  getIcon() {
    return ICON;
  }

  getUrl() {
    return '';
  }

  async getSigner(): Promise<Signer> {
    if (!this.connector['sdk']) {
      return super.getSigner();
    }
    const provider = await this.connector.getProvider();
    return {
      provider: new BrowserProvider(provider as any),
      sendTransaction: this._sendEtherspotTx.bind(this),
    } as unknown as Signer;
  }

  private async _sendEtherspotTx(tx: any) {
    const sdk = this.connector['sdk'] as PrimeSdk;

    await sdk.clearUserOpsFromBatch();

    await sdk.addUserOpsToBatch({
      to: tx.to,
      value: tx.value,
      data: tx.data,
    });

    const op = await sdk.estimate();
    const uoHash = await sdk.send(op);

    return {
      wait: async () => {
        let userOpsReceipt: any = null;
        const timeout = Date.now() + 60000; // 1 minute timeout
        while (userOpsReceipt == null && Date.now() < timeout) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          userOpsReceipt = await sdk.getUserOpReceipt(uoHash);
        }
        if (!userOpsReceipt) {
          return null;
        }

        return {
          ...userOpsReceipt.receipt,
          hash: userOpsReceipt.receipt.transactionHash,
        };
      },
    };
  }

  createConnectorFn() {
    type Properties = {
      sdk?: PrimeSdk;
    };

    const id = !this.connectorOptions?.etherspotOptions
      ? 'web3Auth'
      : 'web3AuthSA';
    const name = !this.connectorOptions?.etherspotOptions
      ? NAME
      : 'Web3Auth SmartAccount';
    const connectorOptions = this.connectorOptions;
    const web3auth = new Web3Auth(this.connectorOptions);

    let provider_: IProvider | undefined;
    let sdk_: PrimeSdk | undefined;

    let accountsChanged: Connector['onAccountsChanged'] | undefined;
    let chainChanged: Connector['onChainChanged'] | undefined;
    let connect: Connector['onConnect'] | undefined;
    let disconnect: Connector['onDisconnect'] | undefined;

    return createConnector<IProvider, Properties>((config) => ({
      id,
      name,
      type: id,
      icon: ICON,
      async connect({ chainId } = {}) {
        const provider = await this.getProvider();
        if (!provider) throw new ProviderNotFoundError();

        const accounts = await this.getAccounts();

        try {
          let currentChainId = await this.getChainId();
          if (chainId && chainId != currentChainId) {
            const chain = await this.switchChain!({ chainId }).catch(
              (error) => {
                if (error.code === UserRejectedRequestError.code) throw error;
                return { id: currentChainId };
              },
            );
            currentChainId = chain?.id ?? currentChainId;
          }

          if (connect) {
            provider.removeListener('connect', connect);
            connect = undefined;
          }
          if (!accountsChanged) {
            accountsChanged = this.onAccountsChanged.bind(this);
            provider.on('accountsChanged', accountsChanged);
          }
          if (!chainChanged) {
            chainChanged = this.onChainChanged.bind(this);
            provider.on('chainChanged', chainChanged);
          }
          if (!disconnect) {
            disconnect = this.onDisconnect.bind(this);
            provider.on('disconnect', disconnect);
          }

          return { accounts, chainId: currentChainId };
        } catch (error) {
          if (
            /(user rejected|connection request reset)/i.test(
              (error as ProviderRpcError)?.message,
            )
          ) {
            throw new UserRejectedRequestError(error as Error);
          }
          throw error;
        }
      },
      async disconnect() {
        const provider = await this.getProvider();

        if (accountsChanged) {
          provider.removeListener('accountsChanged', accountsChanged);
          accountsChanged = undefined;
        }
        if (chainChanged) {
          provider.removeListener('chainChanged', chainChanged);
          chainChanged = undefined;
        }
        if (disconnect) {
          provider.removeListener('disconnect', disconnect);
          disconnect = undefined;
        }
        if (!connect) {
          connect = this.onConnect!.bind(this);
          provider.on('connect', connect);
        }

        await web3auth.logout();
      },
      async getAccounts() {
        const provider = await this.getProvider();
        if (!provider) throw new ProviderNotFoundError();

        if (sdk_) {
          const smartAccount = await sdk_.getCounterFactualAddress();
          return [getAddress(smartAccount)];
        }

        const accounts = (await (provider as any).request({
          method: 'eth_accounts',
        })) as string[];

        return accounts.map((x) => getAddress(x));
      },
      async getChainId() {
        const provider = await this.getProvider();
        if (!provider) throw new ProviderNotFoundError();
        const hexChainId = await provider.request({ method: 'eth_chainId' });

        return Number(hexChainId);
      },
      async getProvider() {
        async function init() {
          if (!web3auth.connected) {
            await web3auth.init();
            await web3auth.connect();
          }

          return web3auth.provider!;
        }

        if (!provider_) {
          provider_ = await init();

          if (connectorOptions.etherspotOptions) {
            const web3Provider = await Web3WalletProvider.connect(provider_);
            sdk_ = new PrimeSdk(web3Provider, {
              chainId: connectorOptions.etherspotOptions.chainId,
              entryPointAddress:
                connectorOptions.etherspotOptions.entryPointAddress,
              rpcProviderUrl: connectorOptions.etherspotOptions.rpcProviderUrl,
              walletFactoryAddress:
                connectorOptions.etherspotOptions.walletFactoryAddress,
              bundlerProvider: new EtherspotBundler(
                connectorOptions.etherspotOptions.chainId,
                connectorOptions.etherspotOptions.bundlerApiKey,
                connectorOptions.etherspotOptions.bundlerUrl,
              ),
            });
            this.sdk = sdk_;
          }
        }

        return provider_;
      },
      async switchChain({ chainId }) {
        const chain = config.chains.find((x) => x.id === chainId);
        if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());
        if (
          connectorOptions.etherspotOptions &&
          connectorOptions.etherspotOptions.chainId !== chainId
        )
          throw new UnsupportedChainIdError(
            new Error(`${chainId} chain id not supported`),
          );

        await web3auth.switchChain({ chainId: toHex(chainId) });
        return chain;
      },
      async isAuthorized() {
        return web3auth.connected;
      },
      onAccountsChanged(accounts) {
        if (accounts.length === 0) this.onDisconnect();
        else
          config.emitter.emit('change', {
            accounts: accounts.map((x) => getAddress(x)),
          });
      },
      onChainChanged(chain) {
        const chainId = Number(chain);
        config.emitter.emit('change', { chainId });
      },
      async onConnect(connectInfo) {
        const accounts = await this.getAccounts();
        if (accounts.length === 0) return;

        const chainId = Number(connectInfo.chainId);
        config.emitter.emit('connect', { accounts, chainId });

        const provider = await this.getProvider();
        if (provider) {
          if (connect) {
            provider.removeListener('connect', connect);
            connect = undefined;
          }
          if (!accountsChanged) {
            accountsChanged = this.onAccountsChanged.bind(this);
            provider.on('accountsChanged', accountsChanged);
          }
          if (!chainChanged) {
            chainChanged = this.onChainChanged.bind(this);
            provider.on('chainChanged', chainChanged);
          }
          if (!disconnect) {
            disconnect = this.onDisconnect.bind(this);
            provider.on('disconnect', disconnect);
          }
        }
      },
      async onDisconnect(error) {
        config.emitter.emit('disconnect');

        const provider = await this.getProvider();
        if (accountsChanged) {
          provider.removeListener('accountsChanged', accountsChanged);
          accountsChanged = undefined;
        }
        if (chainChanged) {
          provider.removeListener('chainChanged', chainChanged);
          chainChanged = undefined;
        }
        if (disconnect) {
          provider.removeListener('disconnect', disconnect);
          disconnect = undefined;
        }
        if (!connect) {
          connect = this.onConnect!.bind(this);
          provider.on('connect', connect);
        }
      },
    }));
  }
}
