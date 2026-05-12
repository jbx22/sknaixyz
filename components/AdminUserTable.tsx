import React, { useState } from "react";
import { useAdminUsers } from "../helpers/useAdminUsers";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./Dialog";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Ban, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage } from "./Form";
import { z } from "zod";
import { UserStatus } from "../helpers/schema";
import styles from "./AdminUserTable.module.css";

const editUserSchema = z.object({
  userId: z.number(),
  role: z.enum(["admin", "user", "superadmin"]),
  subscriptionTier: z.enum(["free", "basic", "premium"]),
  status: z.enum(["active", "suspended", "deactivated"]),
  displayName: z.string().min(2),
  email: z.string().email(),
});

type StatusActionType = {
  userId: number;
  status: UserStatus;
  message: string;
};

export const AdminUserTable = () => {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [tierFilter, setTierFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  const [editingUser, setEditingUser] = useState<z.infer<typeof editUserSchema> | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [statusAction, setStatusAction] = useState<StatusActionType | null>(null);

  const { 
    data, 
    isLoading, 
    updateUser, 
    deleteUser, 
    isUpdating, 
    isDeleting 
  } = useAdminUsers({
    page,
    limit: 10,
    search,
    role: roleFilter as "admin" | "user" | "superadmin" | undefined,
    subscriptionTier: tierFilter as "free" | "basic" | "premium" | undefined,
    status: statusFilter as "active" | "suspended" | "deactivated" | undefined,
  });

  const form = useForm({
    defaultValues: {
      userId: 0,
      role: "user",
      subscriptionTier: "free",
      status: "active",
      displayName: "",
      email: "",
    },
    schema: editUserSchema,
  });

  const handleEdit = (user: any) => {
    const values = {
      userId: user.id,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      status: user.status,
      displayName: user.displayName,
      email: user.email,
    };
    setEditingUser(values);
    form.setValues(values);
  };

  const handleSave = (values: z.infer<typeof editUserSchema>) => {
    updateUser(values, {
      onSuccess: () => {
        setEditingUser(null);
        toast.success(t.messages.updateSuccess);
      },
      onError: () => {
        toast.error(t.messages.error);
      }
    });
  };

  const handleDelete = () => {
    if (!deletingUserId) return;
    deleteUser({ userId: deletingUserId }, {
      onSuccess: () => {
        setDeletingUserId(null);
        toast.success(t.messages.deleteSuccess);
      },
      onError: (err) => {
        toast.error(err.message || t.messages.error);
      }
    });
  };

  const handleStatusChange = () => {
    if (!statusAction) return;
    updateUser(
      { userId: statusAction.userId, status: statusAction.status },
      {
        onSuccess: () => {
          setStatusAction(null);
          toast.success(t.messages.updateSuccess);
        },
        onError: () => {
          toast.error(t.messages.error);
        }
      }
    );
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case "active":
        return "success";
      case "suspended":
        return "warning";
      case "deactivated":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <Input 
            placeholder={t.filters.search} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <Select value={roleFilter || "_empty"} onValueChange={(v) => setRoleFilter(v === "_empty" ? undefined : v)}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder={t.filters.role} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_empty">{t.filters.all}</SelectItem>
            <SelectItem value="superadmin">{t.roles.superadmin}</SelectItem>
            <SelectItem value="admin">{t.roles.admin}</SelectItem>
            <SelectItem value="user">{t.roles.user}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tierFilter || "_empty"} onValueChange={(v) => setTierFilter(v === "_empty" ? undefined : v)}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder={t.filters.tier} />
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
            <SelectValue placeholder={t.filters.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_empty">{t.filters.all}</SelectItem>
            <SelectItem value="active">{t.statuses.active}</SelectItem>
            <SelectItem value="suspended">{t.statuses.suspended}</SelectItem>
            <SelectItem value="deactivated">{t.statuses.deactivated}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>{t.users}</th>
              <th>{t.filters.role}</th>
              <th>{t.filters.tier}</th>
              <th>{t.filters.status}</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7}><Skeleton className={styles.rowSkeleton} /></td>
                </tr>
              ))
            ) : data?.users.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.displayName}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </td>
                <td>
                  <Badge variant={
                    user.role === "superadmin" ? "warning" : 
                    user.role === "admin" ? "default" : "secondary"
                  }>
                    {t.roles[user.role]}
                  </Badge>
                </td>
                <td>
                  <Badge variant={
                    user.subscriptionTier === "premium" ? "warning" : 
                    user.subscriptionTier === "basic" ? "default" : "outline"
                  }>
                    {t.tiers[user.subscriptionTier]}
                  </Badge>
                </td>
                <td>
                  <Badge variant={getStatusBadgeVariant(user.status)}>
                    {t.statuses[user.status]}
                  </Badge>
                </td>
                <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                <td>
                  <div className={styles.actions}>
                    {user.status === "active" && (
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className={styles.suspendBtn}
                        onClick={() => setStatusAction({
                          userId: user.id,
                          status: "suspended",
                          message: t.messages.confirmSuspend
                        })}
                      >
                        <Ban size={16} />
                      </Button>
                    )}
                    {user.status === "suspended" && (
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className={styles.activateBtn}
                        onClick={() => setStatusAction({
                          userId: user.id,
                          status: "active",
                          message: t.messages.confirmActivate
                        })}
                      >
                        <CheckCircle size={16} />
                      </Button>
                    )}
                    {user.status !== "deactivated" && (
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className={styles.deactivateBtn}
                        onClick={() => setStatusAction({
                          userId: user.id,
                          status: "deactivated",
                          message: t.messages.confirmDeactivate
                        })}
                      >
                        <XCircle size={16} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className={styles.deleteBtn} onClick={() => setDeletingUserId(user.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && (
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

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.actions.edit}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className={styles.form}>
              <FormItem name="displayName">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input 
                    value={form.values.displayName} 
                    onChange={e => form.setValues(prev => ({...prev, displayName: e.target.value}))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              
              <FormItem name="email">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    value={form.values.email} 
                    onChange={e => form.setValues(prev => ({...prev, email: e.target.value}))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <div className={styles.formRow}>
                <FormItem name="role" className={styles.flex1}>
                  <FormLabel>{t.filters.role}</FormLabel>
                  <Select 
                    value={form.values.role} 
                    onValueChange={v => form.setValues(prev => ({...prev, role: v as any}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t.roles.user}</SelectItem>
                      <SelectItem value="admin">{t.roles.admin}</SelectItem>
                      <SelectItem value="superadmin">{t.roles.superadmin}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>

                <FormItem name="subscriptionTier" className={styles.flex1}>
                  <FormLabel>{t.filters.tier}</FormLabel>
                  <Select 
                    value={form.values.subscriptionTier} 
                    onValueChange={v => form.setValues(prev => ({...prev, subscriptionTier: v as any}))}
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
              </div>

              <FormItem name="status">
                <FormLabel>{t.filters.status}</FormLabel>
                <Select 
                  value={form.values.status} 
                  onValueChange={v => form.setValues(prev => ({...prev, status: v as any}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t.statuses.active}</SelectItem>
                    <SelectItem value="suspended">{t.statuses.suspended}</SelectItem>
                    <SelectItem value="deactivated">{t.statuses.deactivated}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setEditingUser(null)}>{t.actions.cancel}</Button>
                <Button type="submit" disabled={isUpdating}>{t.actions.save}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.actions.confirmDelete}</DialogTitle>
          </DialogHeader>
          <p>{t.messages.confirmDeleteUser}</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeletingUserId(null)}>{t.actions.cancel}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{t.actions.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation */}
      <Dialog open={!!statusAction} onOpenChange={(open) => !open && setStatusAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusAction?.status === "suspended" && t.actions.suspend}
              {statusAction?.status === "active" && t.actions.activate}
              {statusAction?.status === "deactivated" && t.actions.deactivate}
            </DialogTitle>
          </DialogHeader>
          <p>{statusAction?.message}</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStatusAction(null)}>{t.actions.cancel}</Button>
            <Button onClick={handleStatusChange} disabled={isUpdating}>
              {t.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};