import React, { useState, useEffect, useRef } from "react";
import { chevronDown } from "../assets";
import { useOnClickOutside } from "../utils";
import styles from "../styles";

const AmountIn = ({
  value,
  onChange,
  currencyValue,
  onSelect,
  currencies,
  isSwapping,
}) => {
  const [showList, setShowList] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState("Select");
  const [inputValue, setInputValue] = useState(value);
  const ref = useRef();

  useOnClickOutside(ref, () => setShowList(false));

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (Object.keys(currencies).includes(currencyValue))
      setActiveCurrency(currencies[currencyValue]);
    else setActiveCurrency("Select");
  }, [currencies, currencyValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue); // 允许为空
    if (typeof onChange === "function") {
      onChange(newValue); // 直接传递用户输入，包括空值
    }
  };

  return (
    <div className={styles.amountContainer}>
      <input
        placeholder="0.0"
        type="number"
        value={inputValue}
        disabled={isSwapping}
        onChange={handleInputChange}
        className={styles.amountInput}
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
                className={`${styles.currencyListItem} ${
                  activeCurrency === tokenName ? "bg-site-dim2" : ""
                } cursor-pointer`}
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

export default AmountIn;
