import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { useWalletTransactions } from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { InvestorWallet } from "../components/InvestorWallet";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import styles from "./invest.wallet.module.css";

export default function WalletPage() {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].wallet;
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useWalletTransactions(page, pageSize);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(Number(val));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === "ar" ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{t.title} | SKNAI</title>
      </Helmet>

      <div className={styles.container}>
        <h1 className={styles.pageTitle}>{t.title}</h1>
        
        <InvestorWallet className={styles.walletCard} />

        <div className={styles.historySection}>
          <h2 className={styles.sectionTitle}>{t.history}</h2>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t.type}</th>
                  <th>{t.amount}</th>
                  <th>{t.status}</th>
                  <th>{t.date}</th>
                  <th>{t.reference}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5}>
                        <Skeleton className={styles.rowSkeleton} />
                      </td>
                    </tr>
                  ))
                ) : data?.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      {language === "ar" ? "لا توجد معاملات" : "No transactions found"}
                    </td>
                  </tr>
                ) : (
                  data?.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div className={styles.typeCell}>
                          {tx.type === "deposit" || tx.type === "income_distribution" || tx.type === "token_sale" ? (
                            <ArrowDownLeft size={16} className={styles.inIcon} />
                          ) : (
                            <ArrowUpRight size={16} className={styles.outIcon} />
                          )}
                          <span className={styles.typeText}>{tx.type.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className={styles.amountCell}>
                        {formatCurrency(tx.amount)}
                      </td>
                      <td>
                        <Badge 
                          variant={
                            tx.status === "completed" ? "success" : 
                            tx.status === "pending" ? "warning" : "destructive"
                          }
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className={styles.dateCell}>{formatDate(tx.createdAt.toString())}</td>
                      <td className={styles.refCell}>{tx.referenceId || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > pageSize && (
            <div className={styles.pagination}>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                {tokenizationTranslations[language].common.back}
              </Button>
              <span className={styles.pageInfo}>
                {page} / {Math.ceil(data.total / pageSize)}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= Math.ceil(data.total / pageSize)}
                onClick={() => setPage(p => p + 1)}
              >
                {tokenizationTranslations[language].common.next}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}