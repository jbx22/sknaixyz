import React, { ReactNode, useState } from "react";
import { useLanguage } from "../helpers/useLanguage";
import { structuredLogger } from "../helpers/structuredLogger";
import { useAuth } from "../helpers/useAuth";
import { useNavigate } from "react-router-dom";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Get userId from auth context if available - we'll pass it via a data attribute
    const userId = (window as any).__authUserId;

    // Log the error with structured logging
    structuredLogger.error("React Error Boundary caught an error", {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      userId,
    });

    // Also log to console for development
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorBoundaryFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}

function ErrorBoundaryFallback({
  error,
  errorInfo,
  onReset,
}: ErrorBoundaryFallbackProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    ar: {
      title: "حدث خطأ ما",
      message: "نعتذر، حدث خطأ غير متوقع في التطبيق. يرجى المحاولة مرة أخرى.",
      tryAgain: "حاول مرة أخرى",
      goHome: "الذهاب إلى الصفحة الرئيسية",
      errorDetails: "تفاصيل الخطأ",
    },
    en: {
      title: "Something went wrong",
      message:
        "We apologize, an unexpected error occurred in the application. Please try again.",
      tryAgain: "Try Again",
      goHome: "Go Home",
      errorDetails: "Error Details",
    },
  };

  const t = content[language];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <div className={styles.errorIcon}>⚠️</div>
        </div>

        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.message}>{t.message}</p>

        {error && errorInfo && (
          <details className={styles.details}>
            <summary className={styles.summary}>{t.errorDetails}</summary>
            <div className={styles.detailsContent}>
              <p className={styles.errorMessage}>{error.toString()}</p>
              <pre className={styles.stack}>{errorInfo.componentStack}</pre>
            </div>
          </details>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={onReset}>
            {t.tryAgain}
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => navigate("/")}
          >
            {t.goHome}
          </button>
        </div>
      </div>
    </div>
  );
}