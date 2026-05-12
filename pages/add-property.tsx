import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../helpers/useLanguage";
import { addPropertyTranslations } from "../helpers/addPropertyTranslations";
import { LocationPicker } from "../components/LocationPicker";
import { PropertyCreationForm } from "../components/PropertyCreationForm";
import { ComplianceGate } from "../components/ComplianceGate";
import { Button } from "../components/Button";
import { ChevronLeft, ChevronRight, MapPin, FileText } from "lucide-react";
import styles from "./add-property.module.css";

type Step = 1 | 2;

interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = addPropertyTranslations[language];

  const [step, setStep] = useState<Step>(1);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const handleLocationChange = (data: LocationData) => {
    setLocationData(data);
  };

  const handleContinue = () => {
    if (step === 1 && locationData) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSuccess = () => {
    navigate("/dashboard");
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.pageTitle}</h1>
        <div className={styles.progressContainer}>
          <div className={`${styles.step} ${step >= 1 ? styles.activeStep : ""}`}>
            <div className={styles.stepIcon}>
              <MapPin size={20} />
            </div>
            <span className={styles.stepLabel}>{t.step1}</span>
          </div>
          <div className={`${styles.connector} ${step >= 2 ? styles.activeConnector : ""}`} />
          <div className={`${styles.step} ${step >= 2 ? styles.activeStep : ""}`}>
            <div className={styles.stepIcon}>
              <FileText size={20} />
            </div>
            <span className={styles.stepLabel}>{t.step2}</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <ComplianceGate featureName={language === 'ar' ? 'نشر العقارات' : 'Property publishing'}>
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2>{t.pickLocation}</h2>
              <p className={styles.stepDescription}>{t.pickLocationDesc}</p>
            </div>
            
            <LocationPicker 
              latitude={locationData?.latitude ?? 24.7136}
              longitude={locationData?.longitude ?? 46.6753}
              locationName={locationData?.locationName ?? ""}
              onChange={handleLocationChange}
              manualMode={manualMode}
              onManualModeChange={setManualMode}
            />

            <div className={styles.actions}>
              <Button variant="outline" onClick={handleCancel}>
                {t.cancel}
              </Button>
              <Button 
                onClick={handleContinue} 
                disabled={!locationData}
                className={styles.continueButton}
              >
                {t.continue}
                {language === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && locationData && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className={styles.backButton}
              >
                {language === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {t.back}
              </Button>
              <h2>{t.propertyDetails}</h2>
            </div>

            <PropertyCreationForm
              latitude={locationData.latitude}
              longitude={locationData.longitude}
              locationName={locationData.locationName}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}
        </ComplianceGate>
      </div>
    </div>
  );
}
