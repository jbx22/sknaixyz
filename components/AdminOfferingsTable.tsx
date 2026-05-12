import React, { useState } from "react";
import { useAdminOfferingsList } from "../helpers/useAdminTokenization";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { format } from "date-fns";
import { Edit, ExternalLink } from "lucide-react";
import { OfferingStatus } from "../helpers/schema";
import styles from "./AdminOfferingsTable.module.css";

export const AdminOfferingsTable = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminOfferingsList({ page, pageSize: 10 });

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Skeleton className={styles.skeletonRow} />
        <Skeleton className={styles.skeletonRow} />
        <Skeleton className={styles.skeletonRow} />
      </div>
    );
  }

  const getStatusVariant = (status: OfferingStatus) => {
    switch (status) {
      case "open":
        return "success";
      case "closed":
        return "secondary";
      case "settled":
        return "default";
      case "draft":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>SPV</th>
              <th>Value (SAR)</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.offerings.map((offering) => (
              <tr key={offering.id}>
                <td>#{offering.id}</td>
                <td>
                  <div className={styles.propertyCell}>
                    <span className={styles.propertyTitle}>
                      {offering.propertyTitle}
                    </span>
                    <span className={styles.propertyLocation}>
                      {offering.propertyLocation}
                    </span>
                  </div>
                </td>
                <td>{offering.spvName}</td>
                <td>{Number(offering.totalValue).toLocaleString()}</td>
                <td>
                  <div className={styles.progressWrapper}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${offering.percentSold || 0}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {offering.percentSold?.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td>
                  <Badge variant={getStatusVariant(offering.offeringStatus)}>
                    {offering.offeringStatus}
                  </Badge>
                </td>
                <td>{format(new Date(offering.createdAt), "MMM d, yyyy")}</td>
                <td>
                  <div className={styles.actions}>
                    <Button variant="ghost" size="icon-sm">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <a
                        href={`/invest/offering/${offering.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.offerings.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  No offerings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className={styles.pageInfo}>
          Page {page} of {Math.ceil((data?.total || 0) / 10)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page * 10 >= (data?.total || 0)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};