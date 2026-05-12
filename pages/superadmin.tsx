import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { useAuth } from "../helpers/useAuth";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { AdminStats } from "../components/AdminStats";
import { AdminActivityLog } from "../components/AdminActivityLog";
import { AdminUserTable } from "../components/AdminUserTable";
import { SuperAdminGovernance } from "../components/SuperAdminGovernance";
import { BlockchainLedgerPanel } from "../components/BlockchainLedgerPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/Select";
import { Form, FormItem, FormLabel, FormControl, FormMessage, useForm } from "../components/Form";
import { useCreateUser } from "../helpers/useCreateUser";
import { useAdminUsers } from "../helpers/useAdminUsers";
import { z } from "zod";
import { ShieldAlert, Users, Activity, Database, Plus, Trash2, Ban, CheckCircle, ArrowUp, ArrowDown, Shield, Link2 } from "lucide-react";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/Dialog";
import { toast } from "sonner";
import styles from "./superadmin.module.css";

// Schema for creating a new admin
const createAdminSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "user"]),
  subscriptionTier: z.enum(["free", "basic", "premium"]),
});

export default function SuperAdminPage() {
  const { language } = useLanguage();
  const { authState } = useAuth();
  const t = ADMIN_STRINGS[language];
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  
  // Get current user for self-protection
  const currentUserId = authState.type === "authenticated" ? authState.user.id : null;
  
  // State for Admin Management Tab - fetch all users then filter client-side
  const [adminPage, setAdminPage] = useState(1);
  const { 
    data: allUsersData, 
    isLoading: isLoadingAdmins,
    updateUser,
    deleteUser
  } = useAdminUsers({ 
    page: adminPage, 
    limit: 10,
    // No role filter - we'll filter client-side to show admin and superadmin
  });

  // Filter to show only admin and superadmin users
  const adminUsers = allUsersData ? {
    ...allUsersData,
    users: allUsersData.users.filter(u => u.role === 'admin' || u.role === 'superadmin')
  } : null;

  // Form for creating new admin
  const form = useForm({
    defaultValues: {
      email: "",
      displayName: "",
      password: "",
      role: "admin" as "admin" | "user",
      subscriptionTier: "free" as "free" | "basic" | "premium",
    },
    schema: createAdminSchema,
  });

  const handleCreateAdmin = (values: z.infer<typeof createAdminSchema>) => {
    createUser(values, {
      onSuccess: () => {
        form.setValues({
          email: "",
          displayName: "",
          password: "",
          role: "admin",
          subscriptionTier: "free",
        });
      }
    });
  };

  // Action handlers for admin table
  const [actionUser, setActionUser] = useState<{ id: number, type: 'delete' | 'suspend' | 'activate' | 'promote' | 'demote', currentRole?: string } | null>(null);

  const handleAction = () => {
    if (!actionUser) return;
    
    if (actionUser.type === 'delete') {
      deleteUser({ userId: actionUser.id }, {
        onSuccess: () => {
          setActionUser(null);
          toast.success(language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
        },
        onError: (e) => toast.error(e.message)
      });
    } else if (actionUser.type === 'promote') {
      updateUser({ 
        userId: actionUser.id, 
        role: 'admin'
      }, {
        onSuccess: () => {
          setActionUser(null);
          toast.success(language === 'ar' ? 'تمت الترقية بنجاح' : 'Promoted successfully');
        },
        onError: (e) => toast.error(e.message)
      });
    } else if (actionUser.type === 'demote') {
      updateUser({ 
        userId: actionUser.id, 
        role: 'user'
      }, {
        onSuccess: () => {
          setActionUser(null);
          toast.success(language === 'ar' ? 'تم التخفيض بنجاح' : 'Demoted successfully');
        },
        onError: (e) => toast.error(e.message)
      });
    } else {
      updateUser({ 
        userId: actionUser.id, 
        status: actionUser.type === 'suspend' ? 'suspended' : 'active' 
      }, {
        onSuccess: () => {
          setActionUser(null);
          toast.success(language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully');
        },
        onError: (e) => toast.error(e.message)
      });
    }
  };

  // Compute role breakdown for overview
  const roleStats = allUsersData ? {
    superadmins: allUsersData.users.filter(u => u.role === 'superadmin').length,
    admins: allUsersData.users.filter(u => u.role === 'admin').length,
    users: allUsersData.users.filter(u => u.role === 'user').length,
  } : null;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{language === 'ar' ? 'مركز التحكم الرئيسي | سكن AI' : 'Super Admin Control Center | SKNAI'}</title>
      </Helmet>

      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <ShieldAlert className={styles.icon} size={32} />
          <div>
            <h1 className={styles.title}>
              {language === 'ar' ? 'مركز التحكم الرئيسي' : 'Super Admin Control Center'}
            </h1>
            <p className={styles.subtitle}>
              {language === 'ar' ? 'إدارة ومراقبة النظام بالكامل' : 'System-wide management and oversight'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className={styles.tabs}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="overview">
            <Activity size={16} className={styles.tabIcon} />
            {language === 'ar' ? 'نظرة عامة على النظام' : 'System Overview'}
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Users size={16} className={styles.tabIcon} />
            {language === 'ar' ? 'إدارة المسؤولين' : 'Admin Management'}
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Database size={16} className={styles.tabIcon} />
            {language === 'ar' ? 'سجل النشاطات' : 'Activity Logs'}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users size={16} className={styles.tabIcon} />
            {language === 'ar' ? 'جميع المستخدمين' : 'All Users'}
          </TabsTrigger>
          <TabsTrigger value="blockchain">
            <Link2 size={16} className={styles.tabIcon} />
            {language === 'ar' ? 'السجل الرقمي' : 'Blockchain Ledger'}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: System Overview */}
        <TabsContent value="overview" className={styles.tabContent}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {language === 'ar' ? 'إحصائيات النظام' : 'System Statistics'}
            </h2>
            <AdminStats />
            <SuperAdminGovernance mode="overview" />
          </div>

          {roleStats && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {language === 'ar' ? 'توزيع الصلاحيات' : 'Role Breakdown'}
              </h2>
              <div className={styles.roleStatsGrid}>
                <div className={styles.roleStatCard}>
                  <div className={styles.roleStatIcon} style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                    <ShieldAlert size={24} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className={styles.roleStatContent}>
                    <div className={styles.roleStatValue}>{roleStats.superadmins}</div>
                    <div className={styles.roleStatLabel}>
                      {language === 'ar' ? 'مسؤول أعلى' : 'Superadmins'}
                    </div>
                  </div>
                </div>
                <div className={styles.roleStatCard}>
                  <div className={styles.roleStatIcon} style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                    <Shield size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className={styles.roleStatContent}>
                    <div className={styles.roleStatValue}>{roleStats.admins}</div>
                    <div className={styles.roleStatLabel}>
                      {language === 'ar' ? 'مسؤول' : 'Admins'}
                    </div>
                  </div>
                </div>
                <div className={styles.roleStatCard}>
                  <div className={styles.roleStatIcon} style={{ backgroundColor: 'color-mix(in srgb, var(--muted-foreground) 15%, transparent)' }}>
                    <Users size={24} style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                  <div className={styles.roleStatContent}>
                    <div className={styles.roleStatValue}>{roleStats.users}</div>
                    <div className={styles.roleStatLabel}>
                      {language === 'ar' ? 'مستخدم' : 'Users'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {language === 'ar' ? 'النشاط الأخير' : 'Recent System Activity'}
            </h2>
            <div className={styles.card}>
              <AdminActivityLog limit={10} showFilters={false} />
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Admin Management */}
        <TabsContent value="admins" className={styles.tabContent}>
          <SuperAdminGovernance mode="admins" />
          <div style={{ height: "var(--spacing-6)" }} />
          <div className={styles.grid}>
            {/* Create Admin Form */}
            <div className={styles.createCard}>
              <h3 className={styles.cardTitle}>
                {language === 'ar' ? 'إنشاء حساب مسؤول' : 'Create Admin Account'}
              </h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateAdmin)} className={styles.form}>
                  <FormItem name="displayName">
                    <FormLabel>{language === 'ar' ? 'الاسم' : 'Display Name'}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={language === 'ar' ? 'أحمد محمد' : 'John Doe'} 
                        value={form.values.displayName}
                        onChange={e => form.setValues(prev => ({...prev, displayName: e.target.value}))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem name="email">
                    <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder={language === 'ar' ? 'admin@sknai' : 'admin@sknai'} 
                        value={form.values.email}
                        onChange={e => form.setValues(prev => ({...prev, email: e.target.value}))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem name="password">
                    <FormLabel>{language === 'ar' ? 'كلمة المرور' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={form.values.password}
                        onChange={e => form.setValues(prev => ({...prev, password: e.target.value}))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <div className={styles.formRow}>
                    <FormItem name="role" className={styles.flex1}>
                      <FormLabel>{language === 'ar' ? 'الصلاحية' : 'Role'}</FormLabel>
                      <Select 
                        value={form.values.role} 
                        onValueChange={v => form.setValues(prev => ({...prev, role: v as any}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{language === 'ar' ? 'مسؤول' : 'Admin'}</SelectItem>
                          <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem name="subscriptionTier" className={styles.flex1}>
                      <FormLabel>{language === 'ar' ? 'المستوى' : 'Tier'}</FormLabel>
                      <Select 
                        value={form.values.subscriptionTier} 
                        onValueChange={v => form.setValues(prev => ({...prev, subscriptionTier: v as any}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">{language === 'ar' ? 'مجاني' : 'Free'}</SelectItem>
                          <SelectItem value="basic">{language === 'ar' ? 'أساسي' : 'Basic'}</SelectItem>
                          <SelectItem value="premium">{language === 'ar' ? 'متميز' : 'Premium'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  </div>

                  <Button type="submit" disabled={isCreating} className={styles.submitBtn}>
                    {isCreating ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (
                      <>
                        <Plus size={16} />
                        {language === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Admin List */}
            <div className={styles.listCard}>
              <h3 className={styles.cardTitle}>
                {language === 'ar' ? 'المسؤولون الحاليون' : 'Existing Admins'}
              </h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'المستخدم' : 'User'}</th>
                      <th>{language === 'ar' ? 'الصلاحية' : 'Role'}</th>
                      <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingAdmins ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={4}><Skeleton className={styles.skeletonRow} /></td>
                        </tr>
                      ))
                    ) : adminUsers?.users.map(user => {
                      const isSelf = user.id === currentUserId;
                      const isSuperadmin = user.role === 'superadmin';
                      const isProtected = isSelf || isSuperadmin;

                      return (
                        <tr key={user.id}>
                          <td>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>
                                {user.displayName}
                                {isSelf && (
                                  <Badge variant="outline" style={{ marginLeft: language === 'ar' ? '0' : 'var(--spacing-2)', marginRight: language === 'ar' ? 'var(--spacing-2)' : '0' }}>
                                    {language === 'ar' ? 'أنت' : 'You'}
                                  </Badge>
                                )}
                              </span>
                              <span className={styles.userEmail}>{user.email}</span>
                            </div>
                          </td>
                          <td>
                            <Badge variant={user.role === 'superadmin' ? 'warning' : 'default'}>
                              {language === 'ar' ? t.roles[user.role] : user.role}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'warning' : 'destructive'}>
                              {language === 'ar' ? t.statuses[user.status] : user.status}
                            </Badge>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              {isProtected ? (
                                <Badge variant="outline" className={styles.protectedBadge}>
                                  {language === 'ar' ? 'محمي' : 'Protected'}
                                </Badge>
                              ) : (
                                <>
                                  {user.role === 'user' && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm" 
                                      onClick={() => setActionUser({ id: user.id, type: 'promote', currentRole: user.role })}
                                      title={language === 'ar' ? 'ترقية إلى مسؤول' : 'Promote to Admin'}
                                    >
                                      <ArrowUp size={16} className={styles.successIcon} />
                                    </Button>
                                  )}
                                  {user.role === 'admin' && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm" 
                                      onClick={() => setActionUser({ id: user.id, type: 'demote', currentRole: user.role })}
                                      title={language === 'ar' ? 'تخفيض إلى مستخدم' : 'Demote to User'}
                                    >
                                      <ArrowDown size={16} className={styles.warningIcon} />
                                    </Button>
                                  )}
                                  {user.status === 'active' ? (
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm" 
                                      onClick={() => setActionUser({ id: user.id, type: 'suspend' })}
                                      title={language === 'ar' ? 'توقيف' : 'Suspend'}
                                    >
                                      <Ban size={16} className={styles.warningIcon} />
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm" 
                                      onClick={() => setActionUser({ id: user.id, type: 'activate' })}
                                      title={language === 'ar' ? 'تفعيل' : 'Activate'}
                                    >
                                      <CheckCircle size={16} className={styles.successIcon} />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon-sm" 
                                    onClick={() => setActionUser({ id: user.id, type: 'delete' })}
                                    title={language === 'ar' ? 'حذف' : 'Delete'}
                                  >
                                    <Trash2 size={16} className={styles.dangerIcon} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: All Logs */}
        <TabsContent value="logs" className={styles.tabContent}>
          <SuperAdminGovernance mode="logs" />
          <div style={{ height: "var(--spacing-6)" }} />
          <div className={styles.card}>
            <AdminActivityLog limit={50} showFilters={true} />
          </div>
        </TabsContent>

        {/* Tab 4: User Management */}
        <TabsContent value="users" className={styles.tabContent}>
          <div className={styles.card}>
            <AdminUserTable />
          </div>
        </TabsContent>

        {/* Tab 5: Blockchain Ledger */}
        <TabsContent value="blockchain" className={styles.tabContent}>
          <div className={styles.card}>
            <BlockchainLedgerPanel />
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={!!actionUser} onOpenChange={(open) => !open && setActionUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تأكيد الإجراء' : 'Confirm Action'}</DialogTitle>
          </DialogHeader>
          <p>
            {actionUser?.type === 'delete' && (language === 'ar' 
              ? 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.'
              : 'Are you sure you want to delete this user? This action cannot be undone.')}
            {actionUser?.type === 'suspend' && (language === 'ar'
              ? 'هل أنت متأكد من توقيف هذا المستخدم؟'
              : 'Are you sure you want to suspend this user?')}
            {actionUser?.type === 'activate' && (language === 'ar'
              ? 'هل أنت متأكد من تفعيل هذا المستخدم؟'
              : 'Are you sure you want to activate this user?')}
            {actionUser?.type === 'promote' && (language === 'ar'
              ? 'هل أنت متأكد من ترقية هذا المستخدم إلى مسؤول؟'
              : 'Are you sure you want to promote this user to admin?')}
            {actionUser?.type === 'demote' && (language === 'ar'
              ? 'هل أنت متأكد من تخفيض هذا المسؤول إلى مستخدم عادي؟'
              : 'Are you sure you want to demote this admin to regular user?')}
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setActionUser(null)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant={actionUser?.type === 'activate' || actionUser?.type === 'promote' ? 'primary' : 'destructive'} 
              onClick={handleAction}
            >
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
