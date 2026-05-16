import React from "react";
import styles from "./ComplianceNotice.module.css";

export function ComplianceNotice() {
  return (
    <div className={styles.notice}>
      <span className={styles.icon}>ℹ️</span>
      <p className={styles.text}>
        SKNAI provides rent management, payment facilitation, and reporting services. Actual fund movement, escrow, and investor distributions must be handled through licensed payment or escrow providers and official rental channels where applicable.
      </p>
    </div>
  );
}
