import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { PieChart as PieChartIcon, TrendingUp, DollarSign } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useIncomeHistory, usePortfolio } from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { PortfolioOverview } from "../components/PortfolioOverview";
import { SecondaryMarket } from "../components/SecondaryMarket";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";
import { Skeleton } from "../components/Skeleton";
import styles from "./invest.portfolio.module.css";

export default function PortfolioPage() {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].portfolio;
  const [activeTab, setActiveTab] = useState("holdings");

  // Data Fetching
  const { data: portfolioData, isLoading: isPortfolioLoading } = usePortfolio();
  const { data: incomeData, isLoading: isIncomeLoading } = useIncomeHistory();

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(Number(val));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === "ar" ? "ar-SA" : "en-US"
    );
  };

  const COLORS = ["#00d4ff", "#007cff", "#4CAF50", "#FF9800", "#E91E63"];

  // Prepare chart data
  const chartData =
    portfolioData?.holdings.map((h) => ({
      name: h.propertyTitle,
      value: h.currentValue,
    })) || [];

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{t.title} | SKNAI</title>
      </Helmet>

      <div className={styles.container}>
        <h1 className={styles.pageTitle}>{t.title}</h1>

        <PortfolioOverview className={styles.overview} />

        <div className={styles.contentSection}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="holdings">{t.holdings}</TabsTrigger>
              <TabsTrigger value="income">{t.stats.totalIncome}</TabsTrigger>
              <TabsTrigger value="secondary">
                {tokenizationTranslations[language].secondary.title}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="holdings" className={styles.tabContent}>
              {isPortfolioLoading ? (
                <div className={styles.loadingContainer}>
                  <Skeleton className={styles.chartSkeleton} />
                  <Skeleton className={styles.tableSkeleton} />
                </div>
              ) : !portfolioData || portfolioData.holdings.length === 0 ? (
                <div className={styles.emptyState}>
                  <PieChartIcon size={48} />
                  <p>
                    {language === "ar"
                      ? "لا توجد ممتلكات لعرضها"
                      : "No holdings to display"}
                  </p>
                </div>
              ) : (
                <div className={styles.holdingsContainer}>
                  <div className={styles.chartSection}>
                    <h3 className={styles.sectionTitle}>Asset Allocation</h3>
                    <div className={styles.chartWrapper}>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className={styles.holdingsTableSection}>
                    <h3 className={styles.sectionTitle}>{t.holdings}</h3>
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>{t.table.asset}</th>
                            <th>{t.table.quantity}</th>
                            <th>{t.table.avgPrice}</th>
                            <th>{t.table.currentPrice}</th>
                            <th>{t.table.value}</th>
                            <th>{t.table.income}</th>
                            <th>{t.table.ownership}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolioData.holdings.map((holding) => (
                            <tr key={holding.holdingId}>
                              <td>
                                <div className={styles.assetCell}>
                                  <span className={styles.assetTitle}>
                                    {holding.propertyTitle}
                                  </span>
                                  <span className={styles.assetLocation}>
                                    {holding.propertyLocation}
                                  </span>
                                </div>
                              </td>
                              <td>{holding.quantity.toLocaleString()}</td>
                              <td>
                                {formatCurrency(
                                  Number(holding.averagePurchasePrice)
                                )}
                              </td>
                              <td>
                                {formatCurrency(Number(holding.tokenPrice))}
                              </td>
                              <td className={styles.valueCell}>
                                {formatCurrency(holding.currentValue)}
                              </td>
                              <td className={styles.incomeValue}>
                                +
                                {formatCurrency(
                                  Number(holding.totalIncomeReceived)
                                )}
                              </td>
                              <td>
                                {holding.ownershipPercentage.toFixed(4)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="income" className={styles.tabContent}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t.table.asset}</th>
                      <th>{t.table.income}</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isIncomeLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={3}><Skeleton className={styles.rowSkeleton} /></td>
                        </tr>
                      ))
                    ) : incomeData?.distributions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className={styles.emptyCell}>No income history yet</td>
                      </tr>
                    ) : (
                      incomeData?.distributions.map((dist) => (
                        <tr key={dist.id}>
                          <td>{dist.propertyTitle}</td>
                          <td className={styles.incomeValue}>+{formatCurrency(dist.userAmount)}</td>
                          <td>{formatDate(dist.distributionDate.toString())}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="secondary" className={styles.tabContent}>
              <SecondaryMarket />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}