import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getAdminActivityLogs } from "../endpoints/admin/activity_logs_GET.schema";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Skeleton } from "./Skeleton";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import styles from "./AdminActivityLog.module.css";

interface AdminActivityLogProps {
  limit?: number;
  showFilters?: boolean;
}

const getTimeAgo = (dateString: string, language: "en" | "ar") => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

  if (seconds < 60) return rtf.format(-seconds, 'second');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
};

const getActionVariant = (actionType: string): "default" | "destructive" | "success" | "warning" | "secondary" | "outline" => {
  if (actionType.includes("DELETE")) return "destructive";
  if (actionType.includes("CREATE")) return "success";
  if (actionType.includes("UPDATE")) return "default"; // blue primary
  return "secondary";
};

const getTargetLink = (type: string, id: number) => {
  switch (type) {
    case "USER": return `/admin/users?id=${id}`;
    case "PROPERTY": return `/admin/properties?id=${id}`;
    case "SUBSCRIPTION": return `/admin/subscriptions?id=${id}`;
    default: return null;
  }
};

export const AdminActivityLog = ({ limit = 20, showFilters = true }: AdminActivityLogProps) => {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];
  
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "activity", page, limit, actionFilter],
    queryFn: () => getAdminActivityLogs({
      page,
      limit,
      actionType: actionFilter,
    }),
    refetchInterval: 30000, // Real-time updates every 30s
  });

  const getActionLabel = (actionType: string) => {
    // @ts-expect-error - dynamic key access
    return t.actionTypes?.[actionType] || actionType;
  };

  return (
    <div className={styles.container}>
      {/* Filters */}
      {showFilters && (
        <div className={styles.filters}>
          <Select value={actionFilter || "_empty"} onValueChange={(v) => setActionFilter(v === "_empty" ? undefined : v)}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_empty">{t.filters.all}</SelectItem>
              {Object.keys(ADMIN_STRINGS.en.actionTypes).map((key) => (
                <SelectItem key={key} value={key}>
                  {/* @ts-expect-error - dynamic key access */}
                  {t.actionTypes[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}><Skeleton className={styles.rowSkeleton} /></td>
                </tr>
              ))
            ) : data?.logs && data.logs.length > 0 ? (
              data.logs.map((log) => {
                const targetLink = log.targetId && log.targetType ? getTargetLink(log.targetType, log.targetId) : null;
                return (
                  <tr key={log.id}>
                    <td className={styles.timeCell} title={log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}>
                      {log.createdAt ? getTimeAgo(new Date(log.createdAt).toISOString(), language) : "-"}
                    </td>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>{log.adminName}</div>
                        <div className={styles.userEmail}>{log.adminEmail}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getActionVariant(log.actionType)}>
                        {getActionLabel(log.actionType)}
                      </Badge>
                    </td>
                    <td>
                      {targetLink ? (
                        <Link to={targetLink} className={styles.targetLink}>
                          {log.targetType} <ExternalLink size={12} />
                        </Link>
                      ) : (
                        <span className={styles.targetText}>{log.targetType}</span>
                      )}
                      {log.targetId && <span className={styles.targetId}>#{log.targetId}</span>}
                    </td>
                    <td className={styles.detailsCell}>
                      <pre className={styles.detailsPre}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  {t.messages.noActivity}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className={styles.pagination}>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className={styles.pageInfo}>{page} / {data.totalPages}</span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === data.totalPages}
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};