import type { Dispatch } from 'react';
import { useEffect, useMemo } from 'react';
import type { AnyAction } from '@reduxjs/toolkit';

import config from 'config';
import { SANCTIONED_WALLETS } from 'consts/wallet';
import type { RootState } from 'store';
import type {
  TransferInputState,
  ValidationErr,
  TransferValidations,
} from 'store/transferInput';
import { setValidations } from 'store/transferInput';
import type { WalletData, WalletState } from 'store/wallet';
import type { RelayState } from 'store/relay';
import { walletAcceptedChains } from './wallet';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce } from 'use-debounce';
import type { Chain } from '@xertraplatform/wormhole-sdk';
import { amount as sdkAmount } from '@xertraplatform/wormhole-sdk';
import type { TokenTuple } from 'config/tokens';
import { isSameToken } from 'config/tokens';

export const validateFromChain = (chain: Chain | undefined): ValidationErr => {
  if (!chain) return 'Select a source chain';
  const chainConfig = config.chains[chain];
  if (!chainConfig) return 'Select a source chain';
  return '';
};

export const validateToChain = (
  chain: Chain | undefined,
  fromChain: Chain | undefined,
): ValidationErr => {
  if (!chain) return 'Select a destination chain';
  const chainConfig = config.chains[chain];
  if (!chainConfig) return 'Select a destination chain';

  if (
    fromChain &&
    chain === fromChain &&
    !config.routes.isSameChainSwapSupported(chain)
  ) {
    return 'Source chain and destination chain cannot be the same';
  }

  if (
    config.ui.defaultInputs &&
    config.ui.defaultInputs.requiredChain &&
    chain &&
    fromChain
  ) {
    const { requiredChain } = config.ui.defaultInputs;
    const requiredConfig = config.chains[requiredChain];
    if (
      requiredConfig &&
      chain !== requiredChain &&
      fromChain !== requiredChain
    )
      return `Must select ${requiredConfig.displayName} as either the source or destination chain`;
  }
  return '';
};

/**
 * Prevents transfers that would deliver a Wormhole-wrapped token instead of the
 * canonical asset the user is likely expecting.
 *
 * Example: BSC USDC bridged via Wormhole Token Bridge to Ethereum does NOT arrive
 * as canonical (Circle-issued) Ethereum USDC. It arrives as a Wormhole-wrapped
 * representation that happens to share the "USDC" symbol. Receiving this wrapped
 * token is almost never what the user intends, so we block it and explain why.
 *
 * The heuristic: the destination token is a Token Bridge wrapped token, and a
 * different, canonical (non-wrapped) token with the same symbol already exists on
 * the destination chain. In that case bridging would "change the chain" of the
 * underlying asset and produce a token that masquerades as the canonical one.
 */
export const validateDestToken = (
  sourceTokenTuple: TokenTuple | undefined,
  destTokenTuple: TokenTuple | undefined,
): ValidationErr => {
  if (!sourceTokenTuple || !destTokenTuple) return '';

  const sourceToken = config.tokens.get(sourceTokenTuple);
  const destToken = config.tokens.get(destTokenTuple);
  if (!sourceToken || !destToken) return '';

  // Same-chain swaps don't change the underlying asset's chain.
  if (sourceToken.chain === destToken.chain) return '';

  // Only a concern when the destination token is a Wormhole Token Bridge wrapped token.
  if (!destToken.isTokenBridgeWrappedToken) return '';

  // If a different, canonical (non-wrapped) token with the same symbol exists on
  // the destination chain, the wrapped token would be mistaken for it.
  const canonicalEquivalent = config.tokens
    .getAllForChain(destToken.chain)
    .find(
      (t) =>
        !t.isTokenBridgeWrappedToken &&
        t.symbol.toLowerCase() === destToken.symbol.toLowerCase() &&
        !isSameToken(t, destToken),
    );

  if (canonicalEquivalent) {
    const destChainName =
      config.chains[destToken.chain]?.displayName ?? destToken.chain;
    return `Bridging ${sourceToken.symbol} from ${sourceToken.chain} to ${destChainName} delivers a Wormhole-wrapped token, not canonical ${destToken.symbol}. Select a route that delivers native ${destToken.symbol} instead.`;
  }

  return '';
};

export const validateAmount = (
  amount: sdkAmount.Amount | undefined,
  balance: sdkAmount.Amount | null,
): ValidationErr => {
  if (!amount) return '';

  // If user has selected chain, token, and has a balance entry, we can compare
  // their amount input to their balance (using base units)
  const amountBaseUnits = sdkAmount.units(amount);
  if (amountBaseUnits === 0n) {
    return 'Amount must be greater than 0';
  }

  if (balance) {
    const balanceBaseUnits = sdkAmount.units(balance);
    if (amountBaseUnits > balanceBaseUnits) {
      return 'Amount exceeds available balance';
    }
  }
  return '';
};

export const checkAddressIsSanctioned = (address: string): boolean =>
  SANCTIONED_WALLETS.has(address) || SANCTIONED_WALLETS.has('0x' + address);

export const validateWallet = async (
  wallet: WalletData,
  chain: Chain | undefined,
): Promise<ValidationErr> => {
  if (!wallet.address) return 'Wallet not connected';
  try {
    const isSanctioned = checkAddressIsSanctioned(wallet.address);
    if (isSanctioned)
      return 'This address is restricted, bridging is not available';
  } catch (e) {
    // TODO: how do we want to handle if we get an error from the API?
    console.error(e);
  }
  if (wallet.currentAddress && wallet.currentAddress !== wallet.address)
    return 'Switch to connected wallet';
  const acceptedChains = walletAcceptedChains(wallet.type);
  if (chain && !acceptedChains.includes(chain))
    return `Connected wallet is not supported for ${chain}`;
  return '';
};

export const validateToNativeAmt = (
  amount: number,
  max: number | undefined,
): ValidationErr => {
  if (amount < 0) return 'Amount must be equal to or greater than zero';
  if (max && amount > max) return 'Amount exceeds maximum amount';
  return '';
};

export const getIsAutomatic = (route?: string): boolean => {
  if (!route) return false;
  const r = config.routes.get(route);
  if (!r) return false;
  return r.AUTOMATIC_DEPOSIT;
};

export const validateAll = async (
  transferData: TransferInputState,
  relayData: RelayState,
  walletData: WalletState,
): Promise<TransferValidations> => {
  const { fromChain, toChain, amount, route, token, destToken } = transferData;

  const { maxSwapAmt, toNativeToken } = relayData;
  const { sending, receiving } = walletData;
  const isAutomatic = getIsAutomatic(route);
  // Balance validation is now handled separately in the UI components
  const sendingTokenBalance = null;

  const baseValidations = {
    sendingWallet: await validateWallet(sending, fromChain),
    receivingWallet: await validateWallet(receiving, toChain),
    fromChain: validateFromChain(fromChain),
    toChain: validateToChain(toChain, fromChain),
    destToken: validateDestToken(token, destToken),
    amount: validateAmount(amount, sendingTokenBalance),
    toNativeToken: '',
    relayerFee: '',
    receiveAmount: '',
  };

  if (isAutomatic) {
    if (route === 'AutomaticNtt') {
      // Ntt does not support native gas drop-off
      return baseValidations;
    }
    return {
      ...baseValidations,
      toNativeToken: validateToNativeAmt(toNativeToken, maxSwapAmt),
    };
  } else {
    return baseValidations;
  }
};

export const isTransferValid = (validations: TransferValidations) => {
  for (const validationErr of Object.values(validations)) {
    if (validationErr) {
      return false;
    }
  }
  return true;
};

export const validate = async (
  {
    transferInput,
    relay,
    wallet,
  }: {
    transferInput: TransferInputState;
    relay: RelayState;
    wallet: WalletState;
  },
  dispatch: Dispatch<AnyAction>,
  isCanceled: () => boolean,
) => {
  const validations = await validateAll(transferInput, relay, wallet);

  // if all fields are filled out, show validations
  const showValidationState =
    wallet.sending.address &&
    wallet.receiving.address &&
    transferInput.fromChain &&
    transferInput.toChain &&
    transferInput.token &&
    transferInput.destToken &&
    transferInput.amount;

  if (!isCanceled()) {
    dispatch(
      setValidations({
        validations,
        showValidationState: !!showValidationState,
      }),
    );
  }
};

const VALIDATION_DELAY_MS = 250;

export const useValidate = () => {
  const dispatch = useDispatch();
  const transferInput = useSelector((state: RootState) => state.transferInput);
  const relay = useSelector((state: RootState) => state.relay);
  const wallet = useSelector((state: RootState) => state.wallet);
  const stateForValidation = useMemo(
    () => ({ transferInput, relay, wallet }),
    [transferInput, relay, wallet],
  );
  const [debouncedStateForValidation] = useDebounce(
    stateForValidation,
    VALIDATION_DELAY_MS,
  );
  useEffect(() => {
    let canceled = false;
    validate(debouncedStateForValidation, dispatch, () => canceled);
    return () => {
      canceled = true;
    };
  }, [debouncedStateForValidation, dispatch]);
};

export const minutesAndSecondsWithPadding = (
  minutes: number,
  seconds: number,
) => {
  const minsPadded = minutes.toString().padStart(2, '0');
  const secsPadded = seconds.toString().padStart(2, '0');
  return `${minsPadded}:${secsPadded}`;
};

export const millisToMinutesAndSeconds = (millis: number) => {
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return minutesAndSecondsWithPadding(minutes, seconds);
};
