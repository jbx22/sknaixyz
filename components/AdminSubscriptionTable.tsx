import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminSubscriptions } from "../endpoints/admin/subscriptions/list_GET.schema";
import { updateAdminSubscription } from "../endpoints/admin/subscriptions/update_POST.schema";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { Button } from "./Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./Dialog";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Copy, Check, CreditCard, Smartphone, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage } from "./Form";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Calendar } from "./Calendar";
import styles from "./AdminSubscriptionTable.module.css";

const updateSubscriptionSchema = z.object({
  userId: z.number(),
  tier: z.enum(["free", "basic", "premium"]),
  expiresAt: z.date(),
});

export const AdminSubscriptionTable = () => {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [tierFilter, setTierFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  const [updatingUser, setUpdatingUser] = useState<{id: number, name: string} | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["admin", "subscriptions", page, tierFilter, statusFilter],
    queryFn: () => getAdminSubscriptions({
      page,
      limit: 10,
      tier: tierFilter as any,
      status: statusFilter as any,
    }),
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setUpdatingUser(null);
      toast.success(t.messages.updateSuccess);
    },
    onError: (err) => {
      toast.error(err.message || t.messages.error);
    }
  });

  const form = useForm({
    defaultValues: {
      userId: 0,
      tier: "basic",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    schema: updateSubscriptionSchema,
  });

  const handleUpdateClick = (sub: any) => {
    setUpdatingUser({ id: sub.userId, name: sub.userName });
    form.setValues({
      userId: sub.userId,
      tier: sub.tier,
      expiresAt: new Date(sub.expiresAt),
    });
  };

  const handleSave = (values: z.infer<typeof updateSubscriptionSchema>) => {
    updateMutation.mutate(values);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(t.actions.copied);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return <Banknote size={14} />;
    const lower = method.toLowerCase();
    if (lower.includes('card') || lower.includes('credit') || lower.includes('visa') || lower.includes('mastercard')) {
      return <CreditCard size={14} />;
    }
    if (lower.includes('mobile') || lower.includes('wallet')) {
      return <Smartphone size={14} />;
    }
    return <Banknote size={14} />;
  };

  const truncateTransactionId = (txId: string | null) => {
    if (!txId) return '-';
    if (txId.length <= 12) return txId;
    return `${txId.slice(0, 6)}...${txId.slice(-4)}`;
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "failed": return "destructive";
      case "refunded": return "warning";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <Select value={tierFilter || "_empty"} onValueChange={(v) => setTierFilter(v === "_empty" ? undefined : v)}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder={t.tableHeaders.tier} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_empty">{t.filters.all}</SelectItem>
            <SelectItem value="free">{t.tiers.free}</SelectItem>
            <SelectItem value="basic">{t.tiers.basic}</SelectItem>
            <SelectItem value="premium">{t.tiers.premium}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter || "_empty"} onValueChange={(v) => setStatusFilter(v === "_empty" ? undefined : v)}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder={t.tableHeaders.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_empty">{t.filters.all}</SelectItem>
            <SelectItem value="active">{t.statuses.active}</SelectItem>
            <SelectItem value="expired">{language === 'ar' ? 'منتهي' : 'Expired'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t.tableHeaders.id}</th>
              <th>{t.tableHeaders.user}</th>
              <th>{t.tableHeaders.tier}</th>
              <th>{t.tableHeaders.amount}</th>
              <th>{t.tableHeaders.status}</th>
              <th>{t.tableHeaders.paymentMethod}</th>
              <th>{t.tableHeaders.transactionId}</th>
              <th>{t.tableHeaders.dates}</th>
              <th>{t.tableHeaders.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9}><Skeleton className={styles.rowSkeleton} /></td>
                </tr>
              ))
            ) : data && data.subscriptions.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  {t.messages.noSubscriptions}
                </td>
              </tr>
            ) : data?.subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <div className={styles.idCell}>
                    <span className={styles.subId}>#{sub.id}</span>
                    <span className={styles.userId}>{t.tableHeaders.userId}: {sub.userId}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{sub.userName}</div>
                    <div className={styles.userEmail}>{sub.userEmail}</div>
                  </div>
                </td>
                <td>
                  <Badge variant={
                    sub.tier === "premium" ? "warning" : 
                    sub.tier === "basic" ? "default" : "outline"
                  }>
                    {t.tiers[sub.tier]}
                  </Badge>
                </td>
                <td className={styles.amountCell}>
                  {sub.amount} {sub.currency}
                </td>
                <td>
                  <Badge variant={getPaymentStatusVariant(sub.paymentStatus)}>
                    {t.paymentStatuses[sub.paymentStatus]}
                  </Badge>
                </td>
                <td>
                  {sub.paymentMethod ? (
                    <div className={styles.paymentMethod}>
                      {getPaymentMethodIcon(sub.paymentMethod)}
                      <span>{sub.paymentMethod}</span>
                    </div>
                  ) : (
                    <span className={styles.noData}>-</span>
                  )}
                </td>
                <td>
                  {sub.transactionId ? (
                    <div className={styles.transactionId}>
                      <code className={styles.txCode}>
                        {truncateTransactionId(sub.transactionId)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyToClipboard(sub.transactionId!)}
                        className={styles.copyBtn}
                      >
                        {copiedId === sub.transactionId ? <Check size={12} /> : <Copy size={12} />}
                      </Button>
                    </div>
                  ) : (
                    <span className={styles.noData}>-</span>
                  )}
                </td>
                <td>
                  <div className={styles.dates}>
                    <div className={styles.dateRow}>
                      <span className={styles.dateLabel}>{t.tableHeaders.createdDate}:</span>
                      <span>{sub.createdAt ? formatDateTime(sub.createdAt) : '-'}</span>
                    </div>
                    <div className={styles.dateRow}>
                      <span className={styles.dateLabel}>{t.tableHeaders.startDate}:</span>
                      <span>{formatDate(sub.startedAt)}</span>
                    </div>
                    <div className={styles.dateRow}>
                      <span className={styles.dateLabel}>{t.tableHeaders.endDate}:</span>
                      <span>{formatDate(sub.expiresAt)}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <Button variant="outline" size="sm" onClick={() => handleUpdateClick(sub)}>
                    {t.actions.edit}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 0 && (
        <div className={styles.pagination}>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span>{page} / {data.totalPages}</span>
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

      {/* Update Dialog */}
      <Dialog open={!!updatingUser} onOpenChange={(open) => !open && setUpdatingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تحديث الاشتراك ل' : 'Update Subscription for'} {updatingUser?.name}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className={styles.form}>
              <FormItem name="tier">
                <FormLabel>{t.tableHeaders.tier}</FormLabel>
                <Select 
                  value={form.values.tier} 
                  onValueChange={v => form.setValues(prev => ({...prev, tier: v as any}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{t.tiers.free}</SelectItem>
                    <SelectItem value="basic">{t.tiers.basic}</SelectItem>
                    <SelectItem value="premium">{t.tiers.premium}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>

              <FormItem name="expiresAt">
                <FormLabel>{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiration Date'}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={styles.dateBtn}>
                      <CalendarIcon size={16} />
                      {form.values.expiresAt ? formatDate(form.values.expiresAt) : (language === 'ar' ? 'اختر تاريخ' : 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding>
                    <Calendar
                      mode="single"
                      selected={form.values.expiresAt}
                      onSelect={(date) => date && form.setValues(prev => ({...prev, expiresAt: date}))}
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setUpdatingUser(null)}>{t.actions.cancel}</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{t.actions.save}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};