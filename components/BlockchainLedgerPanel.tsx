import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";
import { LedgerExplorerTab } from "./LedgerExplorerTab";
import { ChainIntegrityTab } from "./ChainIntegrityTab";
import { EmergencyControlsTab } from "./EmergencyControlsTab";
import { ReversalTab } from "./ReversalTab";
import { useLanguage } from "../helpers/useLanguage";
import { LEDGER_STRINGS } from "../helpers/ledgerTranslations";
import { Activity, ShieldAlert, RotateCcw, ShieldCheck } from "lucide-react";
import styles from "./BlockchainLedgerPanel.module.css";

export function BlockchainLedgerPanel() {
  const { language } = useLanguage();
  const t = LEDGER_STRINGS[language];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t.panelTitle}</h2>
        <p className={styles.description}>{t.panelDescription}</p>
      </div>

      <Tabs defaultValue="explorer" className={styles.tabs}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="explorer" className={styles.tabTrigger}>
            <Activity size={16} className={styles.tabIcon} />
            {t.tabs.explorer}
          </TabsTrigger>
          <TabsTrigger value="integrity" className={styles.tabTrigger}>
            <ShieldCheck size={16} className={styles.tabIcon} />
            {t.tabs.integrity}
          </TabsTrigger>
          <TabsTrigger value="emergency" className={styles.tabTrigger}>
            <ShieldAlert size={16} className={styles.tabIcon} />
            {t.tabs.emergency}
          </TabsTrigger>
          <TabsTrigger value="reversal" className={styles.tabTrigger}>
            <RotateCcw size={16} className={styles.tabIcon} />
            {t.tabs.reversal}
          </TabsTrigger>
        </TabsList>

        <div className={styles.contentContainer}>
          <TabsContent value="explorer">
            <LedgerExplorerTab />
          </TabsContent>
          <TabsContent value="integrity">
            <ChainIntegrityTab />
          </TabsContent>
          <TabsContent value="emergency">
            <EmergencyControlsTab />
          </TabsContent>
          <TabsContent value="reversal">
            <ReversalTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}