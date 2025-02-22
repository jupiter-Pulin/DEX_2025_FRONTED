import { Contract } from "@ethersproject/contracts";
import { abis } from "@my-app/contracts";
import { useCall } from "@usedapp/core";
import { parseUnits } from "ethers/lib/utils";
import { useEffect } from "react";

import { ROUTER_ADDRESS, WETH_ADDRESS } from "../config";

export const getAvailableTokens = (pools) => {
  const tokens = pools.reduce((prev, curr) => {
    prev[curr.token0Address] = curr.token0Name;
    prev[curr.token1Address] = curr.token1Name;
    return prev;
  }, {});

  // 添加原生 ETH
  tokens["ETH"] = "ETH";

  return tokens;
};

export const getCounterpartTokens = (pools, fromToken) => {
  // 如果 fromToken 是 "ETH"，将其映射为 WETH
  const effectiveFromToken = fromToken === "ETH" ? WETH_ADDRESS : fromToken;

  return pools
    .filter(
      (cur) =>
        cur.token0Address === effectiveFromToken ||
        cur.token1Address === effectiveFromToken
    )
    .reduce((prev, curr) => {
      if (curr.token0Address === effectiveFromToken) {
        prev[curr.token1Address] = curr.token1Name;
      } else if (curr.token1Address === effectiveFromToken) {
        prev[curr.token0Address] = curr.token0Name;
      }
      return prev;
    }, {});
};

export const findPoolByTokens = (pools, fromToken, toToken) => {
  if (!Array.isArray(pools) || !fromToken || !toToken) return undefined;

  // 如果 fromToken 是 "ETH"，将其映射为 WETH
  const effectiveFromToken = fromToken === "ETH" ? WETH_ADDRESS : fromToken;

  return pools.find(
    (cur) =>
      (cur.token0Address === effectiveFromToken &&
        cur.token1Address === toToken) ||
      (cur.token1Address === effectiveFromToken &&
        cur.token0Address === toToken)
  );
};

export const isOperationPending = (operationState) =>
  operationState.status === "PendingSignature" ||
  operationState.status === "Mining";

export const isOperationFailed = (operationState) =>
  operationState.status === "Fail" || operationState.status === "Exception";

export const isOperationSucceeded = (operationState) =>
  operationState.status === "Success";

export const getFailureMessage = (swapApproveState, swapExecuteState) => {
  if (
    isOperationPending(swapApproveState) ||
    isOperationPending(swapExecuteState)
  ) {
    return undefined;
  }

  if (isOperationFailed(swapApproveState)) {
    return "Approval failed - " + swapApproveState.errorMessage;
  }

  if (isOperationFailed(swapExecuteState)) {
    return "Swap failed - " + swapExecuteState.errorMessage;
  }

  return undefined;
};

export const getSuccessMessage = (swapApproveState, swapExecuteState) => {
  if (
    isOperationPending(swapExecuteState) ||
    isOperationPending(swapApproveState)
  ) {
    return undefined;
  }

  if (isOperationSucceeded(swapExecuteState)) {
    return "Swap executed successfully";
  }

  if (isOperationSucceeded(swapApproveState)) {
    return "Approval successful";
  }

  return undefined;
};

export const useAmountsOut = (pairAddress, amountIn, fromToken, toToken) => {
  const isValidAmountIn = amountIn.gt(parseUnits("0"));
  const areParamsValid = !!(
    pairAddress &&
    isValidAmountIn &&
    fromToken &&
    toToken
  );

  const { error, value } =
    useCall(
      areParamsValid && {
        contract: new Contract(ROUTER_ADDRESS, abis.router01),
        method: "getAmountsOut",
        args: [
          amountIn,
          [fromToken === "ETH" ? WETH_ADDRESS : fromToken, toToken],
        ],
      }
    ) ?? {};
  return error ? parseUnits("0") : value?.amounts[1];
};

export const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};
