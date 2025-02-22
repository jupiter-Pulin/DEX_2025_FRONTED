import React, { useState, useEffect, useRef } from "react";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { chevronDown } from "../assets";
import { useAmountsOut, useOnClickOutside } from "../utils";
import styles from "../styles";

const AmountOut = ({
  fromToken,
  toToken,
  amountIn,
  pairContract,
  currencyValue,
  onSelect,
  currencies,
}) => {
  const [showList, setShowList] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState("Select");
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  const amountOut =
    useAmountsOut(pairContract, amountIn, fromToken, toToken) ??
    parseUnits("0");

  useEffect(() => {
    if (Object.keys(currencies).includes(currencyValue)) {
      setActiveCurrency(currencies[currencyValue]);
    } else {
      setActiveCurrency("Select");
    }
  }, [currencyValue, currencies]);

  useEffect(() => {
    if (amountOut.gt(parseUnits("0"))) {
      setIsVisible(false); // 每次更新时重置为false
      setTimeout(() => setIsVisible(true), 10); // 短暂延迟后变为true，触发动画
    } else {
      setIsVisible(false); // 如果amountOut为0，保持隐藏
    }
  }, [amountOut]);

  return (
    <div className={styles.amountContainer}>
      <input
        placeholder="0.0"
        type="number"
        value={formatUnits(amountOut)}
        disabled
        onChange={() => {}}
        className={`${styles.amountInput} ${
          isVisible ? styles.amountInputVisible : styles.amountInputFade
        }`}
      />
      <div className="relative" onClick={() => setShowList(!showList)}>
        <button className={styles.currencyButton}>
          {activeCurrency}
          <img
            src={chevronDown}
            alt="cheveron-down"
            className={`w-4 h-4 object-contain ml-2 ${
              showList ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
        {showList && (
          <ul ref={ref} className={styles.currencyList}>
            {Object.entries(currencies).map(([token, tokenName], index) => (
              <li
                key={index}
                className={styles.currencyListItem}
                onClick={() => {
                  if (typeof onSelect === "function") onSelect(token);
                  setActiveCurrency(tokenName);
                  setShowList(false);
                }}
              >
                {tokenName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AmountOut;
