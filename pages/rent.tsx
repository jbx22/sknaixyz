import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Home, MapPin, BedDouble, Bath, Maximize, CalendarDays } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import { useAuth } from "../helpers/useAuth";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { useAvailableUnits, useApplyForRent } from "../helpers/useRent";
import { AppHeader } from "../components/AppHeader";
import { BottomNav } from "../components/BottomNav";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./rent.module.css";

export default function RentBrowsePage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const { authState } = useAuth();
  const isLoggedIn = authState.type === "authenticated";

  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ startDate: "", endDate: "", notes: "" });
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  const { data, isLoading } = useAvailableUnits(filters);
  const applyMutation = useApplyForRent();

  const handleApply = async () => {
    if (!applyForm.startDate || !applyForm.endDate) {
      setApplyError("Start and end dates are required");
      return;
    }
    setApplyError("");
    setApplySuccess("");
    try {
      const result = await applyMutation.mutateAsync({
        propertyId: selectedUnit.propertyId,
        unitId: selectedUnit.id,
        startDate: applyForm.startDate,
        endDate: applyForm.endDate,
        notes: applyForm.notes || undefined,
      });
      setApplySuccess(result.message);
      setTimeout(() => { setShowApplyModal(false); setSelectedUnit(null); setApplySuccess(""); setApplyForm({ startDate: "", endDate: "", notes: "" }); }, 2000);
    } catch (err: any) {
      setApplyError(err.message || "Failed to submit application");
    }
  };

  const openApply = (unit: any) => {
    if (!isLoggedIn) return;
    setSelectedUnit(unit);
    setApplyError("");
    setApplySuccess("");
    setShowApplyModal(true);
  };

  const fmt = (val: string | number) => Number(val).toLocaleString(language === "ar" ? "ar-SA" : "en-US");

  return (
    <>
      <Helmet><title>{t.browseRentals} - SKNAI</title></Helmet>
      <AppHeader showNavLinks />
      <div className={styles.page}>
        <h1 className={styles.title}>{t.browseRentals}</h1>
        <p className={styles.subtitle}>{language === "ar" ? "تصفح الوحدات المتاحة للإيجار وتقدم بطلب الآن" : "Browse available rental units and apply now"}</p>

        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            placeholder={language === "ar" ? "بحث..." : "Search..."}
            value={filters.search || ""}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 1 }))}
          />
          <select className={styles.select} value={filters.minBedrooms || ""} onChange={e => setFilters(f => ({ ...f, minBedrooms: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}>
            <option value="">{language === "ar" ? "غرف نوم" : "Bedrooms"}</option>
            {[1,2,3,4].map(n => <option key={n} value={n}>{n}+</option>)}
          </select>
                    {/* Max Rent filter removed per user request */}
        </div>

        {isLoading && <div className={styles.loading}>{t.loading}</div>}

        {!isLoading && data && data.units.length > 0 && (
          <div className={styles.grid}>
            {data.units.map(unit => (
              <div key={unit.id} className={styles.card} onClick={() => openApply(unit)}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>{unit.propertyTitle || `Property #${unit.propertyId}`}</div>
                    <div className={styles.cardLocation}>
                      {unit.propertyCity && <><MapPin size={13} /> {unit.propertyCity}</>}
                    </div>
                  </div>
                  <span className={styles.badgeAvailable}>{unit.status}</span>
                </div>
                <div className={styles.cardDetails}>
                  <span><BedDouble size={14} /> {unit.bedrooms || "-"} {language === "ar" ? "غرف" : "BR"}</span>
                  <span><Bath size={14} /> {unit.bathrooms || "-"} {language === "ar" ? "حمام" : "BA"}</span>
                  <span><Maximize size={14} /> {unit.areaSqm || "-"} {language === "ar" ? "م²" : "m²"}</span>
                  <span><Home size={14} /> {language === "ar" ? "وحدة" : "Unit"} {unit.unitNumber}</span>
                </div>
                <div className={styles.cardFooter}>
                  <div>
                    <div className={styles.rentPrice}>{fmt(unit.monthlyRent)} <span className={styles.rentLabel}>/ {language === "ar" ? "شهر" : "mo"}</span></div>
                  </div>
                  {isLoggedIn && <button className={styles.btn} onClick={(e) => { e.stopPropagation(); openApply(unit); }}>{language === "ar" ? "تقدم الآن" : "Apply Now"}</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && data && data.units.length === 0 && <p className={styles.emptyText}>{t.noData}</p>}
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedUnit && (
        <div className={styles.modalOverlay} onClick={() => setShowApplyModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{language === "ar" ? "طلب إيجار" : "Rental Application"}</h2>
            <p style={{ fontSize: 14, color: "var(--foreground, #6b7280)", marginBottom: 16 }}>
              {selectedUnit.propertyTitle || `Property #${selectedUnit.propertyId}`} — {language === "ar" ? "وحدة" : "Unit"} {selectedUnit.unitNumber}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{fmt(selectedUnit.monthlyRent)} {t.sar} / {language === "ar" ? "شهر" : "mo"}</p>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{language === "ar" ? "تاريخ البداية" : "Start Date"}</label>
                <input type="date" className={styles.formInput} value={applyForm.startDate} onChange={e => setApplyForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{language === "ar" ? "تاريخ النهاية" : "End Date"}</label>
                <input type="date" className={styles.formInput} value={applyForm.endDate} onChange={e => setApplyForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{language === "ar" ? "ملاحظات" : "Notes"} ({language === "ar" ? "اختياري" : "optional"})</label>
              <input className={styles.formInput} value={applyForm.notes} onChange={e => setApplyForm(f => ({ ...f, notes: e.target.value }))} placeholder={language === "ar" ? "أي ملاحظات..." : "Any notes..."} />
            </div>
            {applyError && <p className={styles.error}>{applyError}</p>}
            {applySuccess && <p className={styles.success}>{applySuccess}</p>}
            <div className={styles.modalActions}>
              <button className={styles.btn} onClick={() => setShowApplyModal(false)}>{language === "ar" ? "إلغاء" : "Cancel"}</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleApply} disabled={applyMutation.isPending}>
                {applyMutation.isPending ? (language === "ar" ? "جاري التقديم..." : "Submitting...") : (language === "ar" ? "تقدم بطلب" : "Submit Application")}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
