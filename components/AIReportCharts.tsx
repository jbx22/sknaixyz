import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./Chart";
import { AIReport } from "../endpoints/properties/ai_report_POST.schema";
import { useLanguage } from "../helpers/useLanguage";
import { t } from "../helpers/aiReportTranslations";
import styles from "./AIReportCharts.module.css";

interface AIReportChartsProps {
  report: AIReport;
}

export const AIReportCharts: React.FC<AIReportChartsProps> = ({ report }) => {
  const { language } = useLanguage();

  // Prepare chart data
  const radarData = [
    { metric: t("safety", language), value: report.safetyRating },
    { metric: t("walkability", language), value: report.walkabilityScore },
    { metric: t("investment", language), value: report.investmentPotentialScore },
    {
      metric: t("airQuality", language),
      value: Math.min((150 - report.airQualityIndex) / 15, 10),
    },
    { metric: t("quietness", language), value: 10 - report.noiseLevel },
  ];

  const comparisonData = [
    { name: t("thisProperty", language), value: report.pricePerSqm },
    { name: t("areaAverage", language), value: report.areaPricePerSqmAvg },
  ];

  const chartConfig = {
    value: {
      label: t("score", language),
      color: "var(--primary)",
    },
  };

  return (
    <div className={styles.chartsSection}>
      <div className={styles.chartCard}>
        <h4 className={styles.chartTitle}>{t("overallPropertyScore", language)}</h4>
        <div className={styles.chartContainer}>
          <ChartContainer config={chartConfig}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis domain={[0, 10]} />
              <Radar
                name={t("score", language)}
                dataKey="value"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.3}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </RadarChart>
          </ChartContainer>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h4 className={styles.chartTitle}>{t("priceComparison", language)}</h4>
        <div className={styles.chartContainer}>
          <ChartContainer config={chartConfig}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--primary)">
                {comparisonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "var(--accent)" : "var(--primary)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};