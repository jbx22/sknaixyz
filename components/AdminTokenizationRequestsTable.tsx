import React, { useState } from "react";
import { format } from "date-fns";
import { 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock 
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminTokenizationRequests,
  useReviewTokenizationRequest,
} from "../helpers/useTokenizationRequests";
import { TokenizationRequestStatus } from "../helpers/schema";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Textarea } from "./Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import styles from "./AdminTokenizationRequestsTable.module.css";

export const AdminTokenizationRequestsTable = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TokenizationRequestStatus | "all">("all");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const { data, isLoading } = useAdminTokenizationRequests({
    page,
    pageSize: 10,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const toggleRow = (id: number) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const getStatusVariant = (status: TokenizationRequestStatus) => {
    switch (status) {
      case "approved": return "success";
      case "rejected": return "destructive";
      case "under_review": return "secondary"; // Blue/Info
      case "pending": return "warning";
      default: return "default";
    }
  };

  const getStatusIcon = (status: TokenizationRequestStatus) => {
    switch (status) {
      case "approved": return <CheckCircle size={14} />;
      case "rejected": return <XCircle size={14} />;
      case "under_review": return <Loader2 size={14} />;
      case "pending": return <Clock size={14} />;
      default: return null;
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
            variant={statusFilter === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
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
            variant={statusFilter === "under_review" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("under_review")}
          >
            Under Review
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
              <th>ID</th>
              <th>Property</th>
              <th>Owner</th>
              <th>Est. Value (SAR)</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.requests.map((request) => (
              <React.Fragment key={request.id}>
                <tr 
                  className={expandedRowId === request.id ? styles.expandedRow : ""}
                  onClick={() => toggleRow(request.id)}
                >
                  <td>#{request.id}</td>
                  <td>
                    <div className={styles.cellContent}>
                      <span className={styles.primaryText}>{request.propertyTitle}</span>
                      <span className={styles.secondaryText}>{request.propertyLocation}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.cellContent}>
                      <span className={styles.primaryText}>{request.ownerName}</span>
                      <span className={styles.secondaryText}>{request.ownerEmail}</span>
                    </div>
                  </td>
                  <td>
                    {request.estimatedValue 
                      ? Number(request.estimatedValue).toLocaleString() 
                      : "-"}
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(request.status)} className={styles.statusBadge}>
                      {getStatusIcon(request.status)}
                      {request.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td>{format(new Date(request.createdAt), "MMM d, yyyy")}</td>
                  <td>
                    <div className={styles.actions}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(request.id);
                        }}
                      >
                        {expandedRowId === request.id ? "Close" : "Review"}
                        {expandedRowId === request.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </Button>
                      <Button variant="ghost" size="icon-sm" asChild onClick={(e) => e.stopPropagation()}>
                        <a href={`/properties/${request.propertyId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={16} />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
                {expandedRowId === request.id && (
                  <tr className={styles.detailsRow}>
                    <td colSpan={7}>
                      <ReviewSection 
                        request={request} 
                        onSuccess={() => setExpandedRowId(null)} 
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {data?.requests.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No requests found.
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

// Sub-component for the review form to keep things clean
const ReviewSection = ({ request, onSuccess }: { request: any, onSuccess: () => void }) => {
  const [action, setAction] = useState<"approve" | "reject" | "under_review" | null>(null);
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || "");
  const [rejectionReason, setRejectionReason] = useState(request.rejectionReason || "");
  
  const { mutate: reviewRequest, isPending } = useReviewTokenizationRequest();

  const handleSubmit = () => {
    if (!action) return;
    if (action === "reject" && !rejectionReason) {
      toast.error("Rejection reason is required");
      return;
    }

    reviewRequest(
      {
        requestId: request.id,
        action,
        adminNotes: adminNotes || undefined,
        rejectionReason: action === "reject" ? rejectionReason : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Request ${action}ed successfully`);
          onSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <div className={styles.reviewContainer}>
      <div className={styles.reviewGrid}>
        <div className={styles.infoColumn}>
          <h5>Request Details</h5>
          <div className={styles.detailItem}>
            <label>Owner Notes:</label>
            <p>{request.notes || "No notes provided."}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Desired Token Price:</label>
            <p>{request.desiredTokenPrice ? `${Number(request.desiredTokenPrice).toLocaleString()} SAR` : "-"}</p>
          </div>
          <div className={styles.detailItem}>
            <label>Estimated Value:</label>
            <p>{request.estimatedValue ? `${Number(request.estimatedValue).toLocaleString()} SAR` : "-"}</p>
          </div>
        </div>

        <div className={styles.actionColumn}>
          <h5>Admin Review</h5>
          <div className={styles.formGroup}>
            <label>Change Status</label>
            <Select 
              value={action || request.status} 
              onValueChange={(val: any) => setAction(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "reject" && (
            <div className={styles.formGroup}>
              <label className={styles.required}>Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is rejected..."
                className={styles.rejectionInput}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Internal Admin Notes</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes for other admins..."
              rows={2}
            />
          </div>

          <div className={styles.reviewActions}>
            <Button 
              onClick={handleSubmit} 
              disabled={!action || isPending || (action === request.status)}
              variant={action === "reject" ? "destructive" : "primary"}
            >
              {isPending && <Loader2 className="animate-spin" size={16} />}
              Submit Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};