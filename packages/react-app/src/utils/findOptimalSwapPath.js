import { parseUnits, formatUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import { abis } from "@my-app/contracts";

// 常量（根据你的 DEX 手续费结构调整，例如 Uniswap 的 0.3%）
const FEE = 997; // 输入的 99.7% 在扣除 0.3% 手续费后剩余
const FEE_DENOMINATOR = 1000;

// 使用恒定乘积公式计算单跳的输出金额
const getAmountOut = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn.mul(FEE);
  const numerator = amountInWithFee.mul(reserveOut);
  const denominator = reserveIn.mul(FEE_DENOMINATOR).add(amountInWithFee);
  return numerator.div(denominator);
};

// 查找所有可能的路径并返回最优路径
export const findOptimalSwapPath = (pools, fromToken, toToken, amountIn) => {
  // 构建代币连接图
  const graph = {};
  pools.forEach((pool) => {
    const t0 = pool.token0Address.toLowerCase();
    const t1 = pool.token1Address.toLowerCase();
    if (!graph[t0]) graph[t0] = {};
    if (!graph[t1]) graph[t1] = {};
    graph[t0][t1] = pool;
    graph[t1][t0] = pool;
  });

  // 深度优先搜索以查找所有路径
  const findPaths = (start, end, visited = new Set(), path = [start]) => {
    if (start === end) return [path];
    visited.add(start);
    const neighbors = graph[start] || {};
    const paths = [];
    for (const nextToken in neighbors) {
      if (!visited.has(nextToken)) {
        const newVisited = new Set(visited);
        paths.push(
          ...findPaths(nextToken, end, newVisited, [...path, nextToken])
        );
      }
    }
    return paths;
  };

  // 动态获取储备量（假设池中有储备数据；如有需要可调整）
  const getReserves = async (poolAddress, web3) => {
    const pair = new web3.eth.Contract(abis.pair, poolAddress);
    const [reserveA, reserveB] = await pair.methods.getReserve().call();
    return [BigNumber.from(reserveA), BigNumber.from(reserveB)];
  };

  // 计算路径的总输出
  const calculatePathOutput = async (path, amountIn, web3) => {
    let currentAmount = amountIn;
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i].toLowerCase();
      const to = path[i + 1].toLowerCase();
      const pool = graph[from][to];
      if (!pool) return BigNumber.from(0); // 无效路径
      const [reserveA, reserveB] = await getReserves(pool.address, web3);
      const [reserveIn, reserveOut] =
        from === pool.token0Address.toLowerCase()
          ? [reserveA, reserveB]
          : [reserveB, reserveA];
      currentAmount = getAmountOut(currentAmount, reserveIn, reserveOut);
    }
    return currentAmount;
  };

  // 主逻辑
  const allPaths = findPaths(fromToken.toLowerCase(), toToken.toLowerCase());
  if (allPaths.length === 0)
    return { path: [fromToken, toToken], amountOut: BigNumber.from(0) };

  // 评估所有路径（对于大型图可以优化剪枝）
  const evaluatePaths = async (web3) => {
    let bestPath = null;
    let maxAmountOut = BigNumber.from(0);
    for (const path of allPaths) {
      const amountOut = await calculatePathOutput(path, amountIn, web3);
      if (amountOut.gt(maxAmountOut)) {
        maxAmountOut = amountOut;
        bestPath = path;
      }
    }
    return { path: bestPath || allPaths[0], amountOut: maxAmountOut };
  };

  return evaluatePaths;
};
