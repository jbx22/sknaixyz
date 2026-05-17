import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminPricing } from "../endpoints/admin/pricing_GET.schema";
import { updatePricing } from "../endpoints/admin/pricing_POST.schema";
import { Check, X, Save, Tag, Percent, Users, ToggleLeft, ToggleRight, Gift, AlertTriangle, RefreshCw } from "lucide-react";
import css from "./admin.pricing.module.css";

export default function AdminPricingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-pricing"], queryFn: fetchAdminPricing });
  const mut = useMutation({ mutationFn: updatePricing, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pricing"] }) });

  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planEdits, setPlanEdits] = useState<Record<string, any>>({});
  const [editingService, setEditingService] = useState<string | null>(null);
  const [serviceEdits, setServiceEdits] = useState<Record<string, any>>({});
  const [promoModal, setPromoModal] = useState<{ planTier: string } | null>(null);
  const [promoForm, setPromoForm] = useState({ discountPercent: 20, promoCode: "", durationDays: 30, description: "" });
  const [msg, setMsg] = useState("");

  if (isLoading) return <div className={css.loading}>Loading pricing data...</div>;
  const { plans = [], features = [], accessMap = {}, services = [], subscriptions = [] } = data || {};

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  // Plan editing
  const startEditPlan = (tier: string, plan: any) => {
    setEditingPlan(tier);
    setPlanEdits({ monthlyPriceSar: plan.monthlyPriceSar, annualPriceSar: plan.annualPriceSar, perUnitPriceSar: plan.perUnitPriceSar, maxProperties: plan.maxProperties, maxUnitsPerProperty: plan.maxUnitsPerProperty, isActive: plan.isActive, launchBadge: plan.launchBadge });
  };
  const savePlan = (tier: string) => {
    mut.mutate({ action: "update_plan", tier, ...planEdits }, { onSuccess: () => { setEditingPlan(null); flash(`Plan "${tier}" updated`); } });
  };

  // Service editing
  const startEditService = (key: string, svc: any) => {
    setEditingService(key);
    setServiceEdits({ priceSar: svc.priceSar, isActive: svc.isActive, isBetaFree: svc.isBetaFree, betaBadge: svc.betaBadge });
  };
  const saveService = (key: string) => {
    mut.mutate({ action: "update_service", serviceKey: key, ...serviceEdits }, { onSuccess: () => { setEditingService(null); flash(`Service "${key}" updated`); } });
  };

  // Feature access toggle
  const toggleFeature = (planTier: string, featureKey: string, current: boolean) => {
    mut.mutate({ action: "update_feature_access", planTier, featureKey, isIncluded: !current });
  };

  // Beta toggle
  const toggleBeta = (isBeta: boolean) => {
    mut.mutate({ action: "toggle_beta", isBeta }, { onSuccess: () => flash(isBeta ? "Beta mode ON — everything free" : "Beta mode OFF — live pricing active") });
  };

  // Promotion
  const createPromo = () => {
    if (!promoModal) return;
    mut.mutate({ action: "create_promotion", planTier: promoModal.planTier, ...promoForm }, { onSuccess: () => { setPromoModal(null); flash(`Promo "${promoForm.promoCode}" created`); } });
  };
  const clearPromo = (tier: string) => {
    mut.mutate({ action: "clear_promotion", planTier: tier }, { onSuccess: () => flash("Promotion cleared") });
  };

  // User plan override
  const changeUserPlan = (userId: number, planTier: string) => {
    mut.mutate({ action: "update_user_plan", userId, planTier }, { onSuccess: () => flash("User plan updated") });
  };

  const isAllBeta = services.length > 0 && services.every(s => s.isBetaFree);

  return (
    <div className={css.page}>
      {msg && <div className={css.toast}>{msg}</div>}

      <div className={css.header}>
        <div>
          <h1><Tag size={28} /> Pricing Control Panel</h1>
          <p className={css.subtitle}>Manage subscription plans, services, features, promotions</p>
        </div>
        <div className={css.headerActions}>
          <button className={`${css.betaToggle} ${isAllBeta ? css.betaOn : css.betaOff}`} onClick={() => toggleBeta(!isAllBeta)}>
            {isAllBeta ? <><ToggleRight size={20} /> Beta Mode ON</> : <><ToggleLeft size={20} /> Beta Mode OFF</>}
          </button>
          <button className={css.refreshBtn} onClick={() => qc.invalidateQueries({ queryKey: ["admin-pricing"] })}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {isAllBeta && (
        <div className={css.betaBanner}>
          <AlertTriangle size={18} />
          <span>Beta mode active — all plans and services show "Free during Launch". Toggle off to enable live pricing.</span>
        </div>
      )}

      {/* PLANS */}
      <section className={css.section}>
        <h2>Subscription Plans</h2>
        <div className={css.plansGrid}>
          {plans.map(plan => (
            <div key={plan.tier} className={`${css.planCard} ${!plan.isActive ? css.disabled : ""}`}>
              <div className={css.planHeader}>
                <h3>{plan.nameEn} <span className={css.tierBadge}>{plan.tier}</span></h3>
                {plan.launchBadge && <span className={css.badge}>{plan.launchBadge}</span>}
              </div>

              {editingPlan === plan.tier ? (
                <div className={css.editForm}>
                  <label>Monthly (SAR)<input type="number" value={planEdits.monthlyPriceSar} onChange={e => setPlanEdits({ ...planEdits, monthlyPriceSar: +e.target.value })} /></label>
                  <label>Annual (SAR)<input type="number" value={planEdits.annualPriceSar} onChange={e => setPlanEdits({ ...planEdits, annualPriceSar: +e.target.value })} /></label>
                  <label>Per Unit (SAR)<input type="number" value={planEdits.perUnitPriceSar} onChange={e => setPlanEdits({ ...planEdits, perUnitPriceSar: +e.target.value })} /></label>
                  <label>Max Properties<input type="number" value={planEdits.maxProperties ?? ""} onChange={e => setPlanEdits({ ...planEdits, maxProperties: e.target.value ? +e.target.value : null })} /></label>
                  <label>Max Units/Property<input type="number" value={planEdits.maxUnitsPerProperty ?? ""} onChange={e => setPlanEdits({ ...planEdits, maxUnitsPerProperty: e.target.value ? +e.target.value : null })} /></label>
                  <label>Launch Badge<input type="text" value={planEdits.launchBadge ?? ""} onChange={e => setPlanEdits({ ...planEdits, launchBadge: e.target.value || null })} /></label>
                  <label className={css.toggleLabel}>
                    <span>Active</span>
                    <input type="checkbox" checked={planEdits.isActive} onChange={e => setPlanEdits({ ...planEdits, isActive: e.target.checked })} />
                  </label>
                  <div className={css.btnRow}>
                    <button className={css.saveBtn} onClick={() => savePlan(plan.tier)}><Save size={14} /> Save</button>
                    <button className={css.cancelBtn} onClick={() => setEditingPlan(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className={css.planInfo}>
                  <div className={css.priceDisplay}>
                    <span className={css.price}>SAR {plan.monthlyPriceSar}<small>/mo</small></span>
                    <span className={css.price}>SAR {plan.perUnitPriceSar}<small>/unit</small></span>
                  </div>
                  <div className={css.limits}>{plan.maxProperties ? `Max ${plan.maxProperties} properties` : "Unlimited properties"} · {plan.maxUnitsPerProperty ? `Max ${plan.maxUnitsPerProperty} units` : "Unlimited units"}</div>
                  <div className={css.btnRow}>
                    <button className={css.editBtn} onClick={() => startEditPlan(plan.tier, plan)}>Edit Price</button>
                    <button className={css.promoBtn} onClick={() => { setPromoModal({ planTier: plan.tier }); setPromoForm({ ...promoForm, promoCode: `${plan.tier.toUpperCase()}20` }); }}><Gift size={14} /> Promo</button>
                    {plan.launchBadge && plan.launchBadge.includes("%") && <button className={css.clearPromoBtn} onClick={() => clearPromo(plan.tier)}>Clear Promo</button>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE ACCESS MATRIX */}
      <section className={css.section}>
        <h2>Feature Access Matrix</h2>
        <p className={css.sectionNote}>Click checkmarks to toggle feature access per plan</p>
        <div className={css.tableWrap}>
          <table className={css.matrixTable}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Category</th>
                {plans.map(p => <th key={p.tier}>{p.nameEn}</th>)}
              </tr>
            </thead>
            <tbody>
              {features.map(f => (
                <tr key={f.featureKey}>
                  <td className={css.featName}>{f.nameEn}</td>
                  <td className={css.featCat}>{f.category}</td>
                  {plans.map(p => {
                    const a = accessMap[p.tier]?.[f.featureKey];
                    return (
                      <td key={p.tier} className={css.checkCell} onClick={() => toggleFeature(p.tier, f.featureKey, a?.isIncluded ?? false)}>
                        {a?.isIncluded ? <Check size={18} className={css.on} /> : <X size={18} className={css.off} />}
                        {a?.displayValue && <div className={css.limitTag}>{a.displayValue}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SERVICES */}
      <section className={css.section}>
        <h2>Add-On Services</h2>
        <div className={css.servicesGrid}>
          {services.map(svc => (
            <div key={svc.serviceKey} className={`${css.serviceCard} ${!svc.isActive ? css.disabled : ""}`}>
              <div className={css.serviceHeader}>
                <h3>{svc.nameEn}</h3>
                <span className={css.svcKey}>{svc.serviceKey}</span>
                {svc.isBetaFree && <span className={css.betaTag}>BETA FREE</span>}
              </div>
              {editingService === svc.serviceKey ? (
                <div className={css.editForm}>
                  <label>Price (SAR)<input type="number" value={serviceEdits.priceSar} onChange={e => setServiceEdits({ ...serviceEdits, priceSar: +e.target.value })} /></label>
                  <label>Model<input type="text" value={svc.pricingModel} disabled /></label>
                  <label className={css.toggleLabel}><span>Active</span><input type="checkbox" checked={serviceEdits.isActive} onChange={e => setServiceEdits({ ...serviceEdits, isActive: e.target.checked })} /></label>
                  <label className={css.toggleLabel}><span>Beta Free</span><input type="checkbox" checked={serviceEdits.isBetaFree} onChange={e => setServiceEdits({ ...serviceEdits, isBetaFree: e.target.checked })} /></label>
                  <label>Beta Badge<input type="text" value={serviceEdits.betaBadge ?? ""} onChange={e => setServiceEdits({ ...serviceEdits, betaBadge: e.target.value || null })} /></label>
                  <div className={css.btnRow}>
                    <button className={css.saveBtn} onClick={() => saveService(svc.serviceKey)}><Save size={14} /> Save</button>
                    <button className={css.cancelBtn} onClick={() => setEditingService(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className={css.serviceInfo}>
                  <span className={css.svcPrice}>SAR {svc.priceSar} <small>/{svc.pricingModel === "monthly" ? "mo" : "use"}</small></span>
                  <p className={css.svcDesc}>{svc.descriptionEn}</p>
                  {svc.complianceNotes && <p className={css.compliance}>⚠ {svc.complianceNotes}</p>}
                  <button className={css.editBtn} onClick={() => startEditService(svc.serviceKey, svc)}>Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SUBSCRIBERS */}
      <section className={css.section}>
        <h2><Users size={20} /> Active Subscriptions ({subscriptions.length})</h2>
        <table className={css.subsTable}>
          <thead><tr><th>User</th><th>Plan</th><th>Status</th><th>Since</th><th>Override</th></tr></thead>
          <tbody>
            {subscriptions.map(sub => (
              <tr key={sub.id}>
                <td>{sub.displayName} <small>({sub.email})</small></td>
                <td><span className={css.tierBadge}>{sub.planTier}</span></td>
                <td>{sub.status}</td>
                <td>{new Date(sub.currentPeriodStart).toLocaleDateString()}</td>
                <td>
                  <select value={sub.planTier} onChange={e => changeUserPlan(sub.userId, e.target.value)} className={css.planSelect}>
                    {plans.map(p => <option key={p.tier} value={p.tier}>{p.nameEn}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && <tr><td colSpan={5} className={css.empty}>No subscriptions yet</td></tr>}
          </tbody>
        </table>
      </section>

      {/* PROMOTION MODAL */}
      {promoModal && (
        <div className={css.modalOverlay} onClick={() => setPromoModal(null)}>
          <div className={css.modal} onClick={e => e.stopPropagation()}>
            <h2><Gift size={20} /> Create Promotion — {promoModal.planTier}</h2>
            <label>Discount %<input type="number" min={1} max={100} value={promoForm.discountPercent} onChange={e => setPromoForm({ ...promoForm, discountPercent: +e.target.value })} /></label>
            <label>Promo Code<input type="text" value={promoForm.promoCode} onChange={e => setPromoForm({ ...promoForm, promoCode: e.target.value })} /></label>
            <label>Duration (days)<input type="number" value={promoForm.durationDays} onChange={e => setPromoForm({ ...promoForm, durationDays: +e.target.value })} /></label>
            <label>Description<input type="text" value={promoForm.description} onChange={e => setPromoForm({ ...promoForm, description: e.target.value })} placeholder="e.g. Summer special" /></label>
            <div className={css.btnRow}>
              <button className={css.saveBtn} onClick={createPromo} disabled={!promoForm.promoCode}><Percent size={14} /> Create Promo</button>
              <button className={css.cancelBtn} onClick={() => setPromoModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
