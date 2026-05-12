import React, { useState } from "react";
import { useGlobalControls, useAssetControls, useEmergencyFreeze } from "../helpers/useBlockchainLedger";
import { useLanguage } from "../helpers/useLanguage";
import { LEDGER_STRINGS } from "../helpers/ledgerTranslations";
import { ControlKeyType } from "../helpers/schema";
import { Switch } from "./Switch";
import { Button } from "./Button";
import { Input } from "./Input";
import { Badge } from "./Badge";
import { Textarea } from "./Textarea";
import { Skeleton } from "./Skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { AlertTriangle, Zap, PauseCircle, PlayCircle, Search } from "lucide-react";
import { toast } from "sonner";
import styles from "./EmergencyControlsTab.module.css";

export function EmergencyControlsTab() {
  const { language } = useLanguage();
  const t = LEDGER_STRINGS[language];
  
  // Global Controls State
  const { data: globalControls, isLoading: loadingGlobal } = useGlobalControls();
  
  // Asset Controls State
  const [assetIdInput, setAssetIdInput] = useState("");
  const [activeAssetId, setActiveAssetId] = useState<number | null>(null);
  const { data: assetControls, isLoading: loadingAsset, refetch: refetchAsset } = useAssetControls(activeAssetId || 0);

  // Mutation
  const { mutate: emergencyFreeze, isPending } = useEmergencyFreeze();

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDetails, setActionDetails] = useState<{
    scope: "global" | "asset";
    action: "freeze" | "unfreeze";
    controlKey?: ControlKeyType;
    type?: "full" | "transfers" | "issuance" | "distributions";
    assetId?: number;
  } | null>(null);
  const [reason, setReason] = useState("");

  const handleGlobalToggle = (key: ControlKeyType, currentState: boolean) => {
    setActionDetails({
      scope: "global",
      action: currentState ? "unfreeze" : "freeze",
      controlKey: key,
    });
    setReason("");
    setDialogOpen(true);
  };

  const handleAssetAction = (type: "full" | "transfers" | "issuance" | "distributions", currentState: boolean) => {
    if (!activeAssetId) return;
    setActionDetails({
      scope: "asset",
      action: currentState ? "unfreeze" : "freeze",
      type,
      assetId: activeAssetId,
    });
    setReason("");
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!actionDetails || !reason) return;

    emergencyFreeze(
      {
        ...actionDetails,
        reason,
      },
      {
        onSuccess: () => {
          toast.success("Emergency action executed successfully");
          setDialogOpen(false);
          if (actionDetails.scope === "asset") {
            refetchAsset();
          }
        },
        onError: (err) => {
          toast.error(err.message);
        },
      }
    );
  };

  const loadAsset = () => {
    const id = parseInt(assetIdInput);
    if (id && !isNaN(id)) {
      setActiveAssetId(id);
    }
  };

  const getGlobalControlState = (key: ControlKeyType) => {
    return globalControls?.controls.find(c => c.controlKey === key)?.isActive || false;
  };

  return (
    <div className={styles.container}>
      {/* Global Controls Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <AlertTriangle className={styles.icon} />
          {t.emergency.globalTitle}
        </h3>
        
        <div className={styles.grid}>
          {loadingGlobal ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className={styles.controlCardSkeleton} />)
          ) : (
            <>
              {/* Emergency Shutdown - Special Styling */}
              <div className={`${styles.controlCard} ${styles.dangerCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>{t.emergency.controls.emergency_shutdown}</span>
                  <Switch 
                    checked={getGlobalControlState("emergency_shutdown")}
                    onCheckedChange={() => handleGlobalToggle("emergency_shutdown", getGlobalControlState("emergency_shutdown"))}
                  />
                </div>
                <div className={styles.cardStatus}>
                  <Badge variant={getGlobalControlState("emergency_shutdown") ? "destructive" : "success"}>
                    {getGlobalControlState("emergency_shutdown") ? t.emergency.status.active : t.emergency.status.inactive}
                  </Badge>
                </div>
              </div>

              {/* Other Global Controls */}
              {(["global_distribution_freeze", "global_issuance_freeze", "global_trading_freeze"] as ControlKeyType[]).map((key) => (
                <div key={key} className={styles.controlCard}>
                  <div className={styles.cardHeader}>
                    {/* @ts-ignore */}
                    <span className={styles.cardTitle}>{t.emergency.controls[key]}</span>
                    <Switch 
                      checked={getGlobalControlState(key)}
                      onCheckedChange={() => handleGlobalToggle(key, getGlobalControlState(key))}
                    />
                  </div>
                  <div className={styles.cardStatus}>
                    <Badge variant={getGlobalControlState(key) ? "warning" : "outline"}>
                      {getGlobalControlState(key) ? t.emergency.status.active : t.emergency.status.inactive}
                    </Badge>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Asset Controls Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Zap className={styles.icon} />
          {t.emergency.assetTitle}
        </h3>

        <div className={styles.assetSearch}>
          <Input 
            placeholder={t.emergency.assetInputPlaceholder}
            value={assetIdInput}
            onChange={(e) => setAssetIdInput(e.target.value)}
            type="number"
          />
          <Button onClick={loadAsset} disabled={!assetIdInput}>
            <Search size={16} />
            {t.emergency.loadAsset}
          </Button>
        </div>

        {activeAssetId && (
          <div className={styles.assetControls}>
            {loadingAsset ? (
              <Skeleton className={styles.assetSkeleton} />
            ) : assetControls ? (
              <div className={styles.assetGrid}>
                {/* Full Freeze */}
                <div className={styles.assetActionCard}>
                  <h4>{t.emergency.controls.full_freeze}</h4>
                  <div className={styles.statusRow}>
                    <Badge variant={assetControls.controls?.isFrozen ? "destructive" : "success"}>
                      {assetControls.controls?.isFrozen ? t.emergency.status.frozen : t.emergency.status.operational}
                    </Badge>
                  </div>
                  <Button 
                    variant={assetControls.controls?.isFrozen ? "outline" : "destructive"}
                    onClick={() => handleAssetAction("full", !!assetControls.controls?.isFrozen)}
                    className={styles.actionBtn}
                  >
                    {assetControls.controls?.isFrozen ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                    {assetControls.controls?.isFrozen ? "Unfreeze Asset" : "Freeze Asset"}
                  </Button>
                </div>

                {/* Pause Transfers */}
                <div className={styles.assetActionCard}>
                  <h4>{t.emergency.controls.pause_transfers}</h4>
                  <div className={styles.statusRow}>
                    <Badge variant={assetControls.controls?.transfersPaused ? "warning" : "outline"}>
                      {assetControls.controls?.transfersPaused ? "Paused" : "Active"}
                    </Badge>
                  </div>
                  <Button 
                    variant={assetControls.controls?.transfersPaused ? "outline" : "secondary"}
                    onClick={() => handleAssetAction("transfers", !!assetControls.controls?.transfersPaused)}
                    className={styles.actionBtn}
                  >
                    {assetControls.controls?.transfersPaused ? "Resume" : "Pause"}
                  </Button>
                </div>

                {/* Pause Issuance */}
                <div className={styles.assetActionCard}>
                  <h4>{t.emergency.controls.pause_issuance}</h4>
                  <div className={styles.statusRow}>
                    <Badge variant={assetControls.controls?.issuancePaused ? "warning" : "outline"}>
                      {assetControls.controls?.issuancePaused ? "Paused" : "Active"}
                    </Badge>
                  </div>
                  <Button 
                    variant={assetControls.controls?.issuancePaused ? "outline" : "secondary"}
                    onClick={() => handleAssetAction("issuance", !!assetControls.controls?.issuancePaused)}
                    className={styles.actionBtn}
                  >
                    {assetControls.controls?.issuancePaused ? "Resume" : "Pause"}
                  </Button>
                </div>

                {/* Pause Distributions */}
                <div className={styles.assetActionCard}>
                  <h4>{t.emergency.controls.pause_distributions}</h4>
                  <div className={styles.statusRow}>
                    <Badge variant={assetControls.controls?.distributionsPaused ? "warning" : "outline"}>
                      {assetControls.controls?.distributionsPaused ? "Paused" : "Active"}
                    </Badge>
                  </div>
                  <Button 
                    variant={assetControls.controls?.distributionsPaused ? "outline" : "secondary"}
                    onClick={() => handleAssetAction("distributions", !!assetControls.controls?.distributionsPaused)}
                    className={styles.actionBtn}
                  >
                    {assetControls.controls?.distributionsPaused ? "Resume" : "Pause"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>Asset not found or no controls available.</div>
            )}
          </div>
        )}
      </section>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.emergency.dialog.title}</DialogTitle>
            <DialogDescription>{t.emergency.dialog.desc}</DialogDescription>
          </DialogHeader>
          
          <div className={styles.dialogForm}>
            <label className={styles.label}>{t.emergency.dialog.reasonLabel}</label>
            <Textarea 
              placeholder={t.emergency.dialog.reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {t.emergency.dialog.cancel}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmAction}
              disabled={!reason || isPending}
            >
              {t.emergency.dialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}