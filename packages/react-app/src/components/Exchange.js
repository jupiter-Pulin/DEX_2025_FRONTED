import React, { useEffect, useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { abis } from "@my-app/contracts";
import {
  ERC20,
  useContractFunction,
  useEthers,
  useTokenAllowance,
  useTokenBalance,
  useEtherBalance,
} from "@usedapp/core";
import { ethers } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ROUTER_ADDRESS, WETH_ADDRESS } from "../config";
import { AmountIn, AmountOut, Balance } from "./";
import styles from "../styles";
import {
  getAvailableTokens,
  getCounterpartTokens,
  findPoolByTokens,
  isOperationPending,
  getFailureMessage,
  getSuccessMessage,
} from "../utils";

const Exchange = ({ pools }) => {
  const { account } = useEthers();
  const [fromValue, setFromValue] = useState("0");
  const [fromToken, setFromToken] = useState(pools[0].token0Address);
  const [toToken, setToToken] = useState("");
  const [resetState, setResetState] = useState(false);

  const fromValueBigNumber = parseUnits(fromValue || "0");
  const availableTokens = getAvailableTokens(pools);
  const counterpartTokens = getCounterpartTokens(pools, fromToken);
  const pairAddress =
    findPoolByTokens(
      pools,
      fromToken === "ETH" ? WETH_ADDRESS : fromToken,
      toToken
    )?.address ?? "";
  const routerContract = new Contract(ROUTER_ADDRESS, abis.router01);

  // 无条件调用所有 Hooks
  const etherBalance = useEtherBalance(account);
  // 当 fromToken 是 "ETH" 时，使用 WETH_ADDRESS 作为占位符，避免传入无效地址
  const effectiveFromToken = fromToken === "ETH" ? WETH_ADDRESS : fromToken;
  const tokenBalance = useTokenBalance(effectiveFromToken, account);
  const tokenAllowance =
    useTokenAllowance(effectiveFromToken, account, ROUTER_ADDRESS) ||
    parseUnits("0");
  const toTokenBalance = useTokenBalance(toToken, account);

  // 根据 fromToken 选择余额和授权
  const isFromEth = fromToken === "ETH";
  const fromTokenBalance = isFromEth ? etherBalance : tokenBalance;
  const effectiveTokenAllowance = isFromEth
    ? ethers.constants.MaxUint256
    : tokenAllowance;

  const approvedNeeded =
    !isFromEth && fromValueBigNumber.gt(effectiveTokenAllowance);
  const formValueIsGreaterThan0 = fromValueBigNumber.gt(parseUnits("0"));
  const hasEnoughBalance = fromValueBigNumber.lte(
    fromTokenBalance ?? parseUnits("0")
  );

  // 根据 fromToken 决定合约和方法
  const fromTokenContract = isFromEth
    ? null
    : new Contract(fromToken, ERC20.abi);
  const {
    state: swapApproveState,
    send: swapApproveSend,
  } = useContractFunction(fromTokenContract, "approve", {
    transactionName: "onApproveRequested",
    gasLimitBufferPercentage: 10,
  });
  const {
    state: swapExecuteState,
    send: swapExecuteSend,
  } = useContractFunction(
    routerContract,
    isFromEth ? "swapExactEthForTokens" : "swapExactTokenForTokens",
    {
      transactionName: isFromEth
        ? "swapExactEthForTokens"
        : "swapExactTokenForTokens",
      gasLimitBufferPercentage: 10,
    }
  );

  const isApproving = isOperationPending(swapApproveState);
  const isSwapping = isOperationPending(swapExecuteState);
  const canApprove = !isFromEth && !isApproving && approvedNeeded;
  const canSwap =
    !isSwapping &&
    formValueIsGreaterThan0 &&
    hasEnoughBalance &&
    (!approvedNeeded || isFromEth);

  const successMessage = getSuccessMessage(swapApproveState, swapExecuteState);
  const failureMessage = getFailureMessage(swapApproveState, swapExecuteState);

  const onApproveRequested = () => {
    if (!isFromEth) {
      swapApproveSend(ROUTER_ADDRESS, ethers.constants.MaxUint256);
    }
  };

  const onSwapRequested = () => {
    if (isFromEth) {
      swapExecuteSend(
        0, // amountOutMin
        [WETH_ADDRESS, toToken], // path
        account,
        Math.floor(Date.now() / 1000) + 60 * 20,
        { value: fromValueBigNumber } // 发送 ETH
      ).then(() => setFromValue("0"));
    } else {
      swapExecuteSend(
        fromValueBigNumber,
        0,
        [fromToken, toToken],
        account,
        Math.floor(Date.now() / 1000) + 60 * 20
      ).then(() => setFromValue("0"));
    }
  };

  const onFromValueChange = (value) => {
    const trimmedValue = value.trim();
    try {
      if (trimmedValue === "") {
        setFromValue(""); // 允许临时为空
      } else {
        parseUnits(trimmedValue); // 验证输入
        setFromValue(trimmedValue);
      }
    } catch (e) {
      setFromValue("0"); // 无效输入恢复为0
    }
  };

  const onFromTokenChange = (value) => {
    setFromToken(value);
    setFromValue(""); // 重置为空
  };

  const onToTokenChange = (value) => {
    setToToken(value);
  };

  useEffect(() => {
    if (failureMessage || successMessage) {
      setTimeout(() => {
        setResetState(true);
        setFromValue("0");
        setToToken("");
      }, 5000);
    }
  }, [failureMessage, successMessage]);

  return (
    <div className="flex flex-col w-full items-center">
      <div className="mb-8">
        <AmountIn
          value={fromValue}
          onChange={onFromValueChange}
          currencyValue={fromToken}
          onSelect={onFromTokenChange}
          currencies={availableTokens}
          isSwapping={isSwapping && hasEnoughBalance}
        />
        <Balance toTokenBalance={fromTokenBalance} />
      </div>
      <div className="mb-8 w-[100%]">
        <AmountOut
          fromToken={isFromEth ? WETH_ADDRESS : fromToken}
          toToken={toToken}
          amountIn={fromValueBigNumber}
          pairContract={pairAddress}
          currencyValue={toToken}
          onSelect={onToTokenChange}
          currencies={counterpartTokens}
        />
        <Balance toTokenBalance={toTokenBalance} />
      </div>
      {!isFromEth && approvedNeeded && !isSwapping ? (
        <button
          disabled={!canApprove}
          onClick={onApproveRequested}
          className={`
            ${
              canApprove
                ? "bg-site-pink text-white"
                : "bg-site-dim2 text-site-dim2"
            }
            ${styles.actionButton}
          `}
        >
          {isApproving ? "Approving..." : "Approve"}
        </button>
      ) : (
        <button
          disabled={!canSwap}
          onClick={onSwapRequested}
          className={`
            ${
              canSwap
                ? "bg-site-pink text-white"
                : "bg-site-dim2 text-site-dim2"
            }
            ${styles.actionButton}
          `}
        >
          {isSwapping
            ? "Swapping..."
            : hasEnoughBalance
            ? "Swap"
            : "Insufficient Balance"}
        </button>
      )}
      {failureMessage && !resetState ? (
        <p className={styles.message}>{failureMessage}</p>
      ) : successMessage ? (
        <p className={styles.message}>{successMessage}</p>
      ) : (
        ""
      )}
    </div>
  );
};

export default Exchange;
