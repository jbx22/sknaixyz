import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./Tooltip";
import { ThemeModeProvider } from "../helpers/themeMode";
import { SonnerToaster } from "./SonnerToaster";
import { ScrollToHashElement } from "./ScrollToHashElement";
import { AuthProvider } from "../helpers/useAuth";
import { LanguageProvider } from "../helpers/useLanguage";
import { PWAMetaTags } from "../helpers/PWAMetaTags";
import { registerServiceWorker } from "../helpers/serviceWorkerRegistration";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import { CookieConsent } from "./CookieConsent";
import { ErrorBoundary } from "./ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

export const GlobalContextProviders = ({
  children,
}: {
  children: ReactNode;
}) => {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary>
      <PWAMetaTags />
      <QueryClientProvider client={queryClient}>
        <ThemeModeProvider>
          <LanguageProvider>
            <ScrollToHashElement />
            <AuthProvider>
              <TooltipProvider>
                {children}
                <SonnerToaster />
                <PWAInstallPrompt />
                <CookieConsent />
              </TooltipProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeModeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
