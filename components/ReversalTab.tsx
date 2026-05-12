import React, { useState } from "react";
import { useReverseLedgerEntry, useLedgerEntries } from "../helpers/useBlockchainLedger";
import { useLanguage } from "../helpers/useLanguage";
import { LEDGER_STRINGS } from "../helpers/ledgerTranslations";
import { Input } from "./Input";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Search, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import styles from "./ReversalTab.module.css";

export function ReversalTab() {
  const { language } = useLanguage();
  const t = LEDGER_STRINGS[language];
  
  const [entryIdInput, setEntryIdInput] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  
  // Fetch specific entry if selected
  // Note: useLedgerEntries is designed for lists, but we can filter by ID if we had that filter.
  // Since we don't have ID filter in the hook, we'll fetch recent and filter client side or assume the user inputs ID to search.
  // For this implementation, we'll use the list hook but in a real app we might want a specific getEntryById endpoint.
  // We will simulate "Get by ID" by fetching recent entries and filtering, or just showing recent entries to pick from.
  // Given the constraints, let's show recent entries and allow filtering by ID if possible, or just visual selection.
  
  // Actually, let's just show a list of recent entries that are NOT reversed, and allow picking one.
    const { data: recentEntries, isLoading } = useLedgerEntries({
    page: 1,
    limit: 10,
    status: "confirmed", // Only confirmed entries can be reversed
  });

  const { mutate: reverseEntry, isPending } = useReverseLedgerEntry();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [legalRef, setLegalRef] = useState("");

  const handleSelectEntry = (id: number) => {
    setSelectedEntryId(id);
    setDialogOpen(true);
    setReason("");
    setLegalRef("");
  };

  const handleConfirm = () => {
    if (!selectedEntryId || !reason || !legalRef) return;

    reverseEntry(
      {
        originalEntryId: selectedEntryId,
        reason,
        legalReference: legalRef,
      },
      {
        onSuccess: () => {
          toast.success(t.reversal.success);
          setDialogOpen(false);
          setSelectedEntryId(null);
        },
        onError: (err) => {
          toast.error(err.message);
        },
      }
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{t.reversal.title}</h3>
        <div className={styles.searchBox}>
          <Input 
            placeholder={t.reversal.searchPlaceholder}
            value={entryIdInput}
            onChange={(e) => setEntryIdInput(e.target.value)}
            type="number"
          />
          <Button disabled={!entryIdInput}>
            <Search size={16} />
            {t.reversal.findBtn}
          </Button>
        </div>
      </div>

      <div className={styles.recentSection}>
        <h4>{t.reversal.recentReversals}</h4>
        <div className={styles.entryList}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className={styles.entrySkeleton} />)
          ) : recentEntries?.entries.length ? (
            recentEntries.entries.map((entry) => (
              <div key={entry.id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <span className={styles.entryId}>#{entry.id}</span>
                  <Badge variant="outline">{entry.entryType}</Badge>
                  <span className={styles.entryTime}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className={styles.entryDetails}>
                  <div className={styles.detailItem}>
                    <span>Amount:</span>
                    <strong>{entry.sarAmount ? `${entry.sarAmount} SAR` : "-"}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Asset:</span>
                    <strong>{entry.assetId || "-"}</strong>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className={styles.reverseBtn}
                  onClick={() => handleSelectEntry(entry.id)}
                >
                  <RotateCcw size={14} />
                  {t.reversal.reverseBtn}
                </Button>
              </div>
            ))
          ) : (
            <div className={styles.empty}>No reversible entries found.</div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={styles.dialogTitle}>
              <AlertTriangle className={styles.warningIcon} />
              {t.reversal.dialog.title}
            </DialogTitle>
            <DialogDescription>{t.reversal.dialog.desc}</DialogDescription>
          </DialogHeader>

          <div className={styles.form}>
            <div className={styles.field}>
              <label>{t.reversal.dialog.reasonLabel} <span className={styles.required}>*</span></label>
              <Textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detailed reason for reversal..."
              />
            </div>
            <div className={styles.field}>
              <label>{t.reversal.dialog.legalLabel} <span className={styles.required}>*</span></label>
              <Input 
                value={legalRef}
                onChange={(e) => setLegalRef(e.target.value)}
                placeholder="e.g. Court Order #1234"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {t.reversal.dialog.cancel}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={!reason || !legalRef || isPending}
            >
              {t.reversal.dialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}