import React from "react";
import {
  School,
  Stethoscope,
  ShoppingBag,
  Trees,
  Train,
  Film,
  Dumbbell,
  Wifi,
  Users,
  Sun,
} from "lucide-react";
import { Badge } from "./Badge";
import { AIReport } from "../endpoints/properties/ai_report_POST.schema";
import { useLanguage } from "../helpers/useLanguage";
import { t } from "../helpers/aiReportTranslations";
import styles from "./AIReportAmenities.module.css";

interface AIReportAmenitiesProps {
  report: AIReport;
}

export const AIReportAmenities: React.FC<AIReportAmenitiesProps> = ({
  report,
}) => {
  const { language } = useLanguage();

  const formatDistance = (km: number) => {
    return km < 1 ? `${(km * 1000).toFixed(0)}${language === "ar" ? "م" : "m"}` : `${km.toFixed(1)}${language === "ar" ? "كم" : "km"}`;
  };

  return (
    <>
      <div className={styles.amenitiesGrid}>
        <div className={styles.amenityColumn}>
          <h5 className={styles.amenityTitle}>
            <School size={16} /> {t("schools", language)}
          </h5>
          <ul className={styles.amenityList}>
            {report.nearestSchools.map((school, i) => (
              <li key={i} className={styles.amenityItem}>
                <span className={styles.amenityName}>{school.name}</span>
                <span className={styles.amenityMeta}>
                  {school.type} • {formatDistance(school.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.amenityColumn}>
          <h5 className={styles.amenityTitle}>
            <Stethoscope size={16} /> {t("healthcare", language)}
          </h5>
          <ul className={styles.amenityList}>
            {report.nearestHospitals.map((hospital, i) => (
              <li key={i} className={styles.amenityItem}>
                <span className={styles.amenityName}>{hospital.name}</span>
                <span className={styles.amenityMeta}>
                  {formatDistance(hospital.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.amenityColumn}>
          <h5 className={styles.amenityTitle}>
            <ShoppingBag size={16} /> {t("shopping", language)}
          </h5>
          <ul className={styles.amenityList}>
            {report.nearestMalls.map((mall, i) => (
              <li key={i} className={styles.amenityItem}>
                <span className={styles.amenityName}>{mall.name}</span>
                <span className={styles.amenityMeta}>
                  {formatDistance(mall.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.amenityColumn}>
          <h5 className={styles.amenityTitle}>
            <Trees size={16} /> {t("parks", language)}
          </h5>
          <ul className={styles.amenityList}>
            {report.nearestParks.map((park, i) => (
              <li key={i} className={styles.amenityItem}>
                <span className={styles.amenityName}>{park.name}</span>
                <span className={styles.amenityMeta}>
                  {formatDistance(park.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.amenitiesGrid}>
        <div className={styles.amenityColumn}>
          <h5 className={styles.amenityTitle}>
            <Train size={16} /> {t("metroStations", language)}
          </h5>
          <ul className={styles.amenityList}>
            {report.publicTransport.metroStations.map((station, i) => (
              <li key={i} className={styles.amenityItem}>
                <span className={styles.amenityName}>{station.name}</span>
                <span className={styles.amenityMeta}>
                  {formatDistance(station.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.amenityColumn}>
          <h5 className={styles.amenityTitle}>
            <Train size={16} /> {t("busStops", language)}
          </h5>
          <ul className={styles.amenityList}>
            {report.publicTransport.busStops.map((stop, i) => (
              <li key={i} className={styles.amenityItem}>
                <span className={styles.amenityName}>{stop.name}</span>
                <span className={styles.amenityMeta}>
                  {formatDistance(stop.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.amenityColumn}>
          <h5 className={styles.amenityTitle}>
            <Film size={16} /> {t("cinemas", language)}
          </h5>
          <ul className={styles.amenityList}>
            {report.entertainment.cinemas.map((cinema, i) => (
              <li key={i} className={styles.amenityItem}>
                <span className={styles.amenityName}>{cinema.name}</span>
                <span className={styles.amenityMeta}>
                  {formatDistance(cinema.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.amenityColumn}>
          <h5 className={styles.amenityTitle}>
            <Dumbbell size={16} /> {t("sports", language)}
          </h5>
          <ul className={styles.amenityList}>
            {report.entertainment.sportsFacilities.map((facility, i) => (
              <li key={i} className={styles.amenityItem}>
                <span className={styles.amenityName}>{facility.name}</span>
                <span className={styles.amenityMeta}>
                  {formatDistance(facility.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.section}>
        <h5 className={styles.amenityTitle}>
          <Wifi size={16} /> {t("connectivity", language)}
        </h5>
        <div className={styles.tags}>
          {report.internetProviders.map((provider, i) => (
            <Badge key={i} variant="outline">
              {provider}
            </Badge>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h5 className={styles.amenityTitle}>
          <Users size={16} /> {t("demographics", language)}
        </h5>
        <p className={styles.demographicsText}>
          {report.neighborhoodDemographics}
        </p>
      </div>

      <div className={styles.section}>
        <h5 className={styles.amenityTitle}>
          <Sun size={16} /> {t("climate", language)}
        </h5>
        <p className={styles.demographicsText}>{report.climateNotes}</p>
      </div>
    </>
  );
};