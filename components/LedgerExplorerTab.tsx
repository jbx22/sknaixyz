import React, { useState } from "react";
import { useLedgerEntries } from "../helpers/useBlockchainLedger";
import { useLanguage } from "../helpers/useLanguage";
import { LEDGER_STRINGS } from "../helpers/ledgerTranslations";
import { LedgerEntryTypeArrayValues, LedgerEntryStatusArrayValues } from "../helpers/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Input } from "./Input";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./Dialog";
import { Copy, Link2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";
import styles from "./LedgerExplorerTab.module.css";

export function LedgerExplorerTab() {
  const { language } = useLanguage();
  const t = LEDGER_STRINGS[language];
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    entryType: undefined as string | undefined,
    status: undefined as string | undefined,
    assetId: "",
    userId: "",
  });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { data, isLoading, error } = useLedgerEntries({
    page,
    limit: 20,
    entryType: filters.entryType as any,
    status: filters.status as any,
    assetId: filters.assetId ? parseInt(filters.assetId) : undefined,
    userId: filters.userId ? parseInt(filters.userId) : undefined,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t.explorer.details.copied);
  };

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "success";
      case "pending": return "warning";
      case "failed": return "destructive";
      case "reversed": return "secondary";
      default: return "default";
    }
  };

  const getTypeVariant = (type: string) => {
    if (type.includes("freeze")) return "destructive";
    if (type.includes("transfer")) return "default";
    if (type.includes("issuance")) return "success";
    return "outline";
  };

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <Select
            value={filters.entryType || "_empty"}
            onValueChange={(v) => setFilters({ ...filters, entryType: v === "_empty" ? undefined : v })}
          >
            <SelectTrigger className={styles.select}>
              <SelectValue placeholder={t.explorer.type} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_empty">{t.common.all}</SelectItem>
              {LedgerEntryTypeArrayValues.map((type) => (
                <SelectItem key={type} value={type}>
                  {/* @ts-ignore */}
                  {t.entryTypes[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "_empty"}
            onValueChange={(v) => setFilters({ ...filters, status: v === "_empty" ? undefined : v })}
          >
            <SelectTrigger className={styles.select}>
              <SelectValue placeholder={t.explorer.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_empty">{t.common.all}</SelectItem>
              {LedgerEntryStatusArrayValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {/* @ts-ignore */}
                  {t.entryStatuses[status] || status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder={t.explorer.assetId}
            value={filters.assetId}
            onChange={(e) => setFilters({ ...filters, assetId: e.target.value })}
            className={styles.input}
            type="number"
          />

          <Input
            placeholder={t.explorer.userId}
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className={styles.input}
            type="number"
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t.explorer.columns.seq}</th>
              <th>{t.explorer.columns.hash}</th>
              <th>{t.explorer.columns.type}</th>
              <th>{t.explorer.columns.asset}</th>
              <th>{t.explorer.columns.fromTo}</th>
              <th>{t.explorer.columns.amount}</th>
              <th>{t.explorer.columns.status}</th>
              <th>{t.explorer.columns.time}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9}><Skeleton className={styles.skeletonRow} /></td>
                </tr>
              ))
            ) : data?.entries.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>{t.explorer.empty}</td>
              </tr>
            ) : (
              data?.entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr className={styles.row} onClick={() => toggleRow(entry.id)}>
                    <td>{entry.sequenceNumber}</td>
                    <td>
                      <div className={styles.hashCell}>
                        <span title={entry.entryHash}>
                          {entry.entryHash.substring(0, 8)}...
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(entry.entryHash);
                          }}
                        >
                          <Copy size={12} />
                        </Button>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getTypeVariant(entry.entryType)}>
                        {/* @ts-ignore */}
                        {t.entryTypes[entry.entryType] || entry.entryType}
                      </Badge>
                    </td>
                    <td>{entry.assetId || "-"}</td>
                    <td>
                      {entry.fromUserId ? entry.fromUserId : "Sys"} → {entry.toUserId ? entry.toUserId : "Sys"}
                    </td>
                    <td>
                      {entry.sarAmount ? `${Number(entry.sarAmount).toLocaleString()} SAR` : "-"}
                    </td>
                    <td>
                      <Badge variant={getStatusVariant(entry.status)}>
                        {/* @ts-ignore */}
                        {t.entryStatuses[entry.status] || entry.status}
                      </Badge>
                    </td>
                    <td className={styles.timeCell}>
                      {new Date(entry.createdAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                    </td>
                    <td>
                      {expandedRow === entry.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {expandedRow === entry.id && (
                    <tr className={styles.detailsRow}>
                      <td colSpan={9}>
                        <div className={styles.detailsContent}>
                          <div className={styles.detailSection}>
                            <h4>{t.explorer.details.fullHash}</h4>
                            <div className={styles.codeBlock}>
                              {entry.entryHash}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleCopy(entry.entryHash)}
                                className={styles.copyBtn}
                              >
                                <Copy size={14} />
                              </Button>
                            </div>
                          </div>
                          
                          <div className={styles.detailSection}>
                            <h4>{t.explorer.details.prevHash}</h4>
                            <div className={styles.codeBlock}>
                              <Link2 size={14} className={styles.linkIcon} />
                              {entry.previousHash}
                            </div>
                          </div>

                          <div className={styles.detailGrid}>
                            <div className={styles.detailSection}>
                              <h4>{t.explorer.details.metadata}</h4>
                              <pre className={styles.jsonBlock}>
                                {JSON.stringify(entry.metadata, null, 2)}
                              </pre>
                            </div>
                            <div className={styles.detailSection}>
                              <h4>{t.explorer.details.compliance}</h4>
                              <pre className={styles.jsonBlock}>
                                {JSON.stringify(entry.complianceChecks, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                // @ts-ignore
                disabled={page === 1}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive>{page}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => p + 1)}
                // @ts-ignore
                disabled={data.entries.length < 20} // Simple check, ideally use total count
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}