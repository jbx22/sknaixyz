import React from "react";
import { Helmet } from "react-helmet";

export const PWAMetaTags = () => {
  return (
    <Helmet>
      {/* Viewport for mobile responsiveness */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
      />

      {/* Theme Color for browser chrome */}
      <meta name="theme-color" content="#007cff" />

      {/* Description */}
      <meta
        name="description"
        content="SKNAI: The most modern AI-powered real-estate platform in Saudi Arabia. سكني: أحدث منصة عقارية مدعومة بالذكاء الاصطناعي في المملكة العربية السعودية."
      />

      {/* iOS PWA capabilities */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta name="apple-mobile-web-app-title" content="سكني" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

      {/* Web App Manifest */}
      <link rel="manifest" href="/_api/manifest" />

      {/* iOS Splash Screens for various device sizes */}
      {/* iPhone SE, 8, 7, 6s, 6 (750x1334) */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        href="/_api/icon-512"
      />

      {/* iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus (1242x2208) */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        href="/_api/icon-512"
      />

      {/* iPhone X, XS, 11 Pro, 12 mini (1125x2436) */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        href="/_api/icon-512"
      />

      {/* iPhone XR, 11, 12, 12 Pro (828x1792) */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        href="/_api/icon-512"
      />

      {/* iPhone XS Max, 11 Pro Max, 12 Pro Max (1242x2688) */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
        href="/_api/icon-512"
      />

      {/* iPad Mini, Air (1536x2048) */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
        href="/_api/icon-512"
      />

      {/* iPad Pro 10.5" (1668x2224) */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
        href="/_api/icon-512"
      />

      {/* iPad Pro 12.9" (2048x2732) */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        href="/_api/icon-512"
      />
    </Helmet>
  );
};