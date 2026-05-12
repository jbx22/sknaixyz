import React, { useState } from "react";
import { useAdminProperties } from "../helpers/useAdminProperties";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./Dialog";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Star, MessageSquare, Heart } from "lucide-react";
import { toast } from "sonner";
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage } from "./Form";
import { z } from "zod";
import styles from "./AdminPropertyTable.module.css";

const editPropertySchema = z.object({
  propertyId: z.number(),
  status: z.enum(["available", "rented", "sold"]),
  isFeatured: z.boolean(),
  price: z.number(),
});

export const AdminPropertyTable = () => {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  
  const [editingProperty, setEditingProperty] = useState<z.infer<typeof editPropertySchema> | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<number | null>(null);

  const { 
    data, 
    isLoading, 
    updateProperty, 
    deleteProperty, 
    isUpdating, 
    isDeleting 
  } = useAdminProperties({
    page,
    limit: 10,
    search,
    status: statusFilter as any,
    propertyType: typeFilter as any,
  });

  const form = useForm({
    defaultValues: {
      propertyId: 0,
      status: "available",
      isFeatured: false,
      price: 0,
    },
    schema: editPropertySchema,
  });

  const handleEdit = (property: any) => {
    const values = {
      propertyId: property.id,
      status: property.status,
      isFeatured: property.isFeatured,
      price: Number(property.price),
    };
    setEditingProperty(values);
    form.setValues(values);
  };

  const handleSave = (values: z.infer<typeof editPropertySchema>) => {
    updateProperty(values, {
      onSuccess: () => {
        setEditingProperty(null);
        toast.success(t.messages.updateSuccess);
      },
      onError: () => {
        toast.error(t.messages.error);
      }
    });
  };

  const handleDelete = () => {
    if (!deletingPropertyId) return;
    deleteProperty({ propertyId: deletingPropertyId }, {
      onSuccess: () => {
        setDeletingPropertyId(null);
        toast.success(t.messages.deleteSuccess);
      },
      onError: (err) => {
        toast.error(err.message || t.messages.error);
      }
    });
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
        
        <Select value={statusFilter || "_empty"} onValueChange={(v) => setStatusFilter(v === "_empty" ? undefined : v)}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder={t.filters.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_empty">{t.filters.all}</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter || "_empty"} onValueChange={(v) => setTypeFilter(v === "_empty" ? undefined : v)}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_empty">{t.filters.all}</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="land">Land</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Stats</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}><Skeleton className={styles.rowSkeleton} /></td>
                </tr>
              ))
            ) : data?.properties.map((property) => (
              <tr key={property.id}>
                <td>#{property.id}</td>
                <td>
                  <div className={styles.propertyInfo}>
                    <div className={styles.propertyTitle}>
                      {property.title}
                      {property.isFeatured && <Star size={12} className={styles.featuredIcon} fill="currentColor" />}
                    </div>
                    <div className={styles.propertyMeta}>
                      {property.propertyType} • {Number(property.price).toLocaleString()} SAR
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{property.ownerName}</div>
                    <div className={styles.userEmail}>{property.ownerEmail}</div>
                  </div>
                </td>
                <td>
                  <Badge variant={
                    property.status === "available" ? "success" : 
                    property.status === "rented" ? "warning" : "secondary"
                  }>
                    {property.status}
                  </Badge>
                </td>
                <td>
                  <div className={styles.stats}>
                    <span title="Favorites"><Heart size={14} /> {property.favoritesCount}</span>
                    <span title="Chats"><MessageSquare size={14} /> {property.chatsCount}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(property)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className={styles.deleteBtn} onClick={() => setDeletingPropertyId(property.id)}>
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
      <Dialog open={!!editingProperty} onOpenChange={(open) => !open && setEditingProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.actions.edit}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className={styles.form}>
              <FormItem name="price">
                <FormLabel>Price (SAR)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    value={form.values.price} 
                    onChange={e => form.setValues(prev => ({...prev, price: Number(e.target.value)}))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <div className={styles.formRow}>
                <FormItem name="status" className={styles.flex1}>
                  <FormLabel>{t.filters.status}</FormLabel>
                  <Select 
                    value={form.values.status} 
                    onValueChange={v => form.setValues(prev => ({...prev, status: v as any}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>

                <FormItem name="isFeatured" className={styles.flex1}>
                  <FormLabel>Featured</FormLabel>
                  <Select 
                    value={form.values.isFeatured ? "true" : "false"} 
                    onValueChange={v => form.setValues(prev => ({...prev, isFeatured: v === "true"}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setEditingProperty(null)}>{t.actions.cancel}</Button>
                <Button type="submit" disabled={isUpdating}>{t.actions.save}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingPropertyId} onOpenChange={(open) => !open && setDeletingPropertyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.actions.confirmDelete}</DialogTitle>
          </DialogHeader>
          <p>{t.messages.confirmDeleteProperty}</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeletingPropertyId(null)}>{t.actions.cancel}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{t.actions.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};