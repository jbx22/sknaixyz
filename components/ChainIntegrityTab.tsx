import React, { useState } from "react";
import { useLedgerVerify } from "../helpers/useBlockchainLedger";
import { useLanguage } from "../helpers/useLanguage";
import { LEDGER_STRINGS } from "../helpers/ledgerTranslations";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { CheckCircle, XCircle, RefreshCw, ShieldCheck } from "lucide-react";
import styles from "./ChainIntegrityTab.module.css";

export function ChainIntegrityTab() {
  const { language } = useLanguage();
  const t = LEDGER_STRINGS[language];
  const [shouldVerify, setShouldVerify] = useState(false);

  const { data, isLoading, refetch, isFetching } = useLedgerVerify(
    { limit: 1000 },
    shouldVerify
  );

  const handleVerify = () => {
    setShouldVerify(true);
    refetch();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ShieldCheck size={48} className={styles.headerIcon} />
        <h3>{t.integrity.title}</h3>
        <Button 
          onClick={handleVerify} 
          disabled={isFetching}
          size="lg"
          className={styles.verifyBtn}
        >
          {isFetching ? (
            <>
              <RefreshCw className={styles.spin} size={18} />
              {t.integrity.verifying}
            </>
          ) : (
            t.integrity.verifyBtn
          )}
        </Button>
      </div>

      {shouldVerify && (
        <div className={styles.resultContainer}>
          {isLoading || isFetching ? (
            <div className={styles.loadingState}>
              <Skeleton className={styles.skeletonResult} />
              <Skeleton className={styles.skeletonText} />
            </div>
          ) : data ? (
            <div className={`${styles.resultCard} ${data.valid ? styles.valid : styles.invalid}`}>
              <div className={styles.iconWrapper}>
                {data.valid ? (
                  <CheckCircle size={64} className={styles.validIcon} />
                ) : (
                  <XCircle size={64} className={styles.invalidIcon} />
                )}
              </div>
              
              <div className={styles.resultContent}>
                <h4>{data.valid ? t.integrity.validTitle : t.integrity.invalidTitle}</h4>
                <p>{data.valid ? t.integrity.validDesc : t.integrity.invalidDesc}</p>
                
                {!data.valid && data.invalidAtSequence && (
                  <div className={styles.errorDetail}>
                    Sequence #{data.invalidAtSequence}
                  </div>
                )}

                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>{t.integrity.stats.totalVerified}</span>
                    <span className={styles.statValue}>{data.totalEntries || "-"}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>{t.integrity.stats.lastCheck}</span>
                    <span className={styles.statValue}>
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className={styles.technicalDetails}>
                  <pre>{data.details}</pre>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}