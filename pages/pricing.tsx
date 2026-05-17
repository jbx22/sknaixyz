import React from "react";
import { usePlans, useServices } from "../helpers/useSubscriptions";
import { Check, X, Star, Zap, Shield, Crown } from "lucide-react";
import css from "./pricing.module.css";

const tierIcons: Record<string, React.ReactNode> = {
  free: <Star size={24} />,
  professional: <Zap size={24} />,
  enterprise: <Crown size={24} />,
};

export default function PricingPage() {
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: servicesData, isLoading: servicesLoading } = useServices();

  if (plansLoading || servicesLoading) return <div className={css.loading}>Loading plans...</div>;

  const { plans = [], features = [], accessMap = {} } = plansData || {};
  const { services = [] } = servicesData || {};

  return (
    <div className={css.page}>
      {/* Compliance banner */}
      <div className={css.complianceBanner}>
        <Shield size={16} />
        <span>SKnai is a software platform. We do not hold funds, provide escrow, or act as a financial intermediary. All payments processed through licensed providers.</span>
      </div>

      <div className={css.hero}>
        <h1>Simple, Transparent Pricing</h1>
        <p className={css.subtitle}>Everything is <span className={css.betaBadge}>FREE during Launch β</span></p>
        <p className={css.subtext}>No credit card required. Full access to all features while we're in beta.</p>
      </div>

      {/* Plans */}
      <div className={css.plansGrid}>
        {plans.map((plan) => {
          const planAccess = accessMap[plan.tier] || {};
          const planFeatures = features.filter(f => planAccess[f.featureKey]);
          const included = planFeatures.filter(f => planAccess[f.featureKey]?.isIncluded);
          const excluded = planFeatures.filter(f => !planAccess[f.featureKey]?.isIncluded);

          return (
            <div key={plan.tier} className={`${css.planCard} ${plan.tier === "professional" ? css.featured : ""}`}>
              {plan.tier === "professional" && <div className={css.featuredBadge}>Most Popular</div>}
              <div className={css.planIcon}>{tierIcons[plan.tier]}</div>
              <h2 className={css.planName}>{plan.nameEn}</h2>
              <p className={css.planDesc}>{plan.descriptionEn}</p>

              <div className={css.priceBlock}>
                {plan.launchBadge && (
                  <span className={css.launchBadge}>{plan.launchBadge}</span>
                )}
                <div className={css.priceRow}>
                  {Number(plan.monthlyPriceSar) === 0 ? (
                    <span className={css.priceFree}>Free</span>
                  ) : (
                    <>
                      <span className={css.priceCrossed}>SAR {plan.monthlyPriceSar}/mo</span>
                      <span className={css.priceBeta}>SAR 0</span>
                    </>
                  )}
                </div>
                {Number(plan.perUnitPriceSar) > 0 && (
                  <div className={css.perUnit}>+ SAR {plan.perUnitPriceSar}/unit/mo <span className={css.afterLaunch}>(after launch)</span></div>
                )}
                {Number(plan.annualPriceSar) > 0 && Number(plan.monthlyPriceSar) > 0 && (
                  <div className={css.annualNote}>Annual: SAR {plan.annualPriceSar}/yr <span className={css.afterLaunch}>(after launch)</span></div>
                )}
              </div>

              <ul className={css.featureList}>
                {included.map(f => (
                  <li key={f.featureKey} className={css.included}>
                    <Check size={16} className={css.check} />
                    <span>{f.nameEn}</span>
                    {planAccess[f.featureKey]?.displayValue && (
                      <span className={css.limit}> — {planAccess[f.featureKey].displayValue}</span>
                    )}
                  </li>
                ))}
                {excluded.slice(0, 3).map(f => (
                  <li key={f.featureKey} className={css.excluded}>
                    <X size={16} className={css.xIcon} />
                    <span>{f.nameEn}</span>
                  </li>
                ))}
              </ul>

              <button className={`${css.cta} ${plan.tier === "professional" ? css.ctaFeatured : ""}`}>
                {Number(plan.monthlyPriceSar) === 0 ? "Get Started Free" : "Start Free Trial"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add-on Services */}
      <div className={css.servicesSection}>
        <h2>Add-On Services</h2>
        <p className={css.servicesSubtitle}>Pay-per-use services. All free during launch.</p>
        <div className={css.servicesGrid}>
          {services.map((s) => (
            <div key={s.serviceKey} className={css.serviceCard}>
              <div className={css.serviceHeader}>
                <h3>{s.nameEn}</h3>
                {s.betaBadge && <span className={css.serviceBeta}>{s.betaBadge}</span>}
              </div>
              <p className={css.serviceDesc}>{s.descriptionEn}</p>
              <div className={css.servicePrice}>
                {s.isBetaFree ? (
                  <><span className={css.priceCrossed}>SAR {s.priceSar}</span><span className={css.priceBeta}>Free</span></>
                ) : (
                  <span>SAR {s.priceSar}</span>
                )}
                <span className={css.pricingModel}> / {s.pricingModel === "monthly" ? "month" : "use"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className={css.comparisonSection}>
        <h2>Full Feature Comparison</h2>
        <div className={css.tableWrap}>
          <table className={css.comparisonTable}>
            <thead>
              <tr>
                <th>Feature</th>
                {plans.map(p => <th key={p.tier}>{p.nameEn}</th>)}
              </tr>
            </thead>
            <tbody>
              {features.map(f => (
                <tr key={f.featureKey}>
                  <td className={css.featureNameCell}>
                    {f.nameEn}
                    {f.descriptionEn && <span className={css.featureDesc}>{f.descriptionEn}</span>}
                  </td>
                  {plans.map(p => {
                    const a = accessMap[p.tier]?.[f.featureKey];
                    return (
                      <td key={p.tier} className={css.checkCell}>
                        {a?.isIncluded ? (
                          <>{a.displayValue ? <span className={css.limitValue}>{a.displayValue}</span> : <Check size={18} className={css.check} />}</>
                        ) : (
                          <X size={18} className={css.xIcon} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className={css.faqSection}>
        <h2>Frequently Asked Questions</h2>
        <div className={css.faqList}>
          <div className={css.faqItem}>
            <h3>Is it really free?</h3>
            <p>Yes! During our launch phase, all features and services are completely free. No credit card required.</p>
          </div>
          <div className={css.faqItem}>
            <h3>What happens when the launch period ends?</h3>
            <p>We'll notify you 30 days before any pricing changes. Your data stays yours — you can export everything anytime.</p>
          </div>
          <div className={css.faqItem}>
            <h3>Does SKnai handle my rent payments?</h3>
            <p>No. SKnai is a software platform. Payment links are generated through licensed payment providers (Tap, Moyasar, HyperPay). We never hold or process funds directly.</p>
          </div>
          <div className={css.faqItem}>
            <h3>Do I need a license to use SKnai?</h3>
            <p>Property owners can manage their own properties. If you manage properties for others, you may need a FAL license from REGA. We can help connect you with licensed partners.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
