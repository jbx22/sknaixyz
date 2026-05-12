import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "./Button";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./PWAInstallPrompt.module.css";

// Interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Check if user has already dismissed the prompt
      const isDismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (isDismissed) {
        return;
      }

      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!isVisible) return null;

  const content = {
    ar: {
      title: "تثبيت تطبيق سكني",
      description: "قم بتثبيت التطبيق لتجربة تصفح أفضل وأسرع",
      install: "تثبيت",
    },
    en: {
      title: "Install SKNAI App",
      description: "Install the app for a better and faster experience",
      install: "Install",
    },
  };

  const t = content[language];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Download className={styles.icon} size={24} />
        </div>
        <div className={styles.text}>
          <h3 className={styles.title}>{t.title}</h3>
          <p className={styles.description}>{t.description}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          onClick={handleInstallClick}
          variant="secondary"
          size="sm"
          className={styles.installButton}
        >
          {t.install}
        </Button>
        <button
          onClick={handleDismiss}
          className={styles.closeButton}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};