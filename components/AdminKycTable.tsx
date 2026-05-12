import React, { useState } from "react";
import {
  useAdminKycList,
  useAdminKycUpdate,
} from "../helpers/useAdminTokenization";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Textarea } from "./Textarea";
import { format } from "date-fns";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { KycStatus, InvestorSuitability } from "../helpers/schema";
import styles from "./AdminKycTable.module.css";

export const AdminKycTable = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<KycStatus | undefined>(
    undefined
  );
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [suitability, setSuitability] = useState<InvestorSuitability>("retail");

  const { data, isLoading } = useAdminKycList({
    page,
    pageSize: 10,
    status: statusFilter,
  });
  const { mutate: updateKyc, isPending: isUpdating } = useAdminKycUpdate();

  const handleAction = () => {
    if (!selectedRecord || !actionType) return;

    updateKyc(
      {
        kycId: selectedRecord.id,
        action: actionType,
        rejectionReason: actionType === "reject" ? rejectionReason : undefined,
        suitability: actionType === "approve" ? suitability : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            `KYC record ${actionType === "approve" ? "approved" : "rejected"}`
          );
          setSelectedRecord(null);
          setActionType(null);
          setRejectionReason("");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const getStatusVariant = (status: KycStatus) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Skeleton className={styles.skeletonRow} />
        <Skeleton className={styles.skeletonRow} />
        <Skeleton className={styles.skeletonRow} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <Button
            variant={!statusFilter ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "pending" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "approved" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("approved")}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected
          </Button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>National ID</th>
              <th>Nationality</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.records.map((record) => (
              <tr key={record.id}>
                <td>
                  <div className={styles.userCell}>
                    <span className={styles.userName}>
                      {record.fullNameEn || record.userDisplayName}
                    </span>
                    <span className={styles.userEmail}>{record.userEmail}</span>
                  </div>
                </td>
                <td>{record.nationalId || "-"}</td>
                <td>{record.nationality || "-"}</td>
                <td>{format(new Date(record.createdAt), "MMM d, yyyy")}</td>
                <td>
                  <Badge variant={getStatusVariant(record.status)}>
                    {record.status}
                  </Badge>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setSelectedRecord(record);
                        setActionType(null); // Just view
                      }}
                    >
                      <Eye size={16} />
                    </Button>
                    {record.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={styles.approveBtn}
                          onClick={() => {
                            setSelectedRecord(record);
                            setActionType("approve");
                          }}
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={styles.rejectBtn}
                          onClick={() => {
                            setSelectedRecord(record);
                            setActionType("reject");
                          }}
                        >
                          <X size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data?.records.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No KYC records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Dialog */}
      <Dialog
        open={!!selectedRecord}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve KYC"
                : actionType === "reject"
                  ? "Reject KYC"
                  : "KYC Details"}
            </DialogTitle>
            <DialogDescription>
              Review details for {selectedRecord?.fullNameEn}
            </DialogDescription>
          </DialogHeader>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label>Full Name (EN)</label>
              <span>{selectedRecord?.fullNameEn}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Full Name (AR)</label>
              <span>{selectedRecord?.fullNameAr}</span>
            </div>
            <div className={styles.detailItem}>
              <label>National ID</label>
              <span>{selectedRecord?.nationalId}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Date of Birth</label>
              <span>
                {selectedRecord?.dateOfBirth
                  ? format(new Date(selectedRecord.dateOfBirth), "yyyy-MM-dd")
                  : "-"}
              </span>
            </div>
          </div>

          {actionType === "approve" && (
            <div className={styles.formGroup}>
              <label>Investor Suitability</label>
              <Select
                value={suitability}
                onValueChange={(v) => setSuitability(v as InvestorSuitability)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail Investor</SelectItem>
                  <SelectItem value="qualified">Qualified Investor</SelectItem>
                  <SelectItem value="institutional">
                    Institutional Investor
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === "reject" && (
            <div className={styles.formGroup}>
              <label>Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this KYC is being rejected..."
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setSelectedRecord(null)}
              disabled={isUpdating}
            >
              Close
            </Button>
            {actionType && (
              <Button
                variant={actionType === "reject" ? "destructive" : "primary"}
                onClick={handleAction}
                disabled={isUpdating}
              >
                {isUpdating ? "Processing..." : "Confirm"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};