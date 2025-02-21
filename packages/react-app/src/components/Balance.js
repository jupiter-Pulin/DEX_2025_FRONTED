import React from "react";
import { formatUnits, parseUnits } from "ethers/lib/utils";

import styles from "../styles";

const Balance = ({ toTokenBalance }) => {
  return (
    <div className={styles.balance}>
      <p className={styles.balanceText}>
        {toTokenBalance ? (
          <>
            <span className={styles.balanceBold}>Balance: </span>
            {formatUnits(toTokenBalance ?? parseUnits("0"))}
          </>
        ) : (
          ""
        )}
      </p>
    </div>
  );
};

export default Balance;
