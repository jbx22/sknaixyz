import "./loadEnv.js";
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server';
import cron from "node-cron";

const app = new Hono();

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

app.use('*', async (c, next) => {
  const method = c.req.method.toUpperCase();
  const contentLength = Number(c.req.header('content-length') || '0');

  if (contentLength > 2_000_000) {
    return c.json({ error: 'Request payload too large' }, 413);
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = c.req.header('origin');
    const host = c.req.header('host');
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return c.json({ error: 'Cross-origin request blocked' }, 403);
        }
      } catch {
        return c.json({ error: 'Invalid origin' }, 403);
      }
    }
  }

  await next();

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org",
    "font-src 'self' data:",
    "connect-src 'self'",
    isProduction ? 'upgrade-insecure-requests' : '',
  ].filter(Boolean).join('; ');

  c.header('Content-Security-Policy', csp);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=()');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
  c.header('X-DNS-Prefetch-Control', 'off');
  if (isProduction) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
});

app.get('_api/icon-192',async c => {
  try {
    const { handle } = await import("./endpoints/icon-192_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/icon-512',async c => {
  try {
    const { handle } = await import("./endpoints/icon-512_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/manifest',async c => {
  try {
    const { handle } = await import("./endpoints/manifest_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/stats',async c => {
  try {
    const { handle } = await import("./endpoints/admin/stats_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/auth/logout',async c => {
  try {
    const { handle } = await import("./endpoints/auth/logout_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/auth/session',async c => {
  try {
    const { handle } = await import("./endpoints/auth/session_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/ledger/verify',async c => {
  try {
    const { handle } = await import("./endpoints/ledger/verify_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/ledger/entries',async c => {
  try {
    const { handle } = await import("./endpoints/ledger/entries_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/properties/chat',async c => {
  try {
    const { handle } = await import("./endpoints/properties/chat_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/properties/list',async c => {
  try {
    const { handle } = await import("./endpoints/properties/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/users/list',async c => {
  try {
    const { handle } = await import("./endpoints/admin/users/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/ledger/reversal',async c => {
  try {
    const { handle } = await import("./endpoints/ledger/reversal_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/properties/chat',async c => {
  try {
    const { handle } = await import("./endpoints/properties/chat_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/user/export_data',async c => {
  try {
    const { handle } = await import("./endpoints/user/export_data_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/properties/create',async c => {
  try {
    const { handle } = await import("./endpoints/properties/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/properties/details',async c => {
  try {
    const { handle } = await import("./endpoints/properties/details_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/activity_logs',async c => {
  try {
    const { handle } = await import("./endpoints/admin/activity_logs_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/users/create',async c => {
  try {
    const { handle } = await import("./endpoints/admin/users/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/users/delete',async c => {
  try {
    const { handle } = await import("./endpoints/admin/users/delete_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/users/update',async c => {
  try {
    const { handle } = await import("./endpoints/admin/users/update_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/auth/oauth_callback',async c => {
  try {
    const { handle } = await import("./endpoints/auth/oauth_callback_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/subscription/status',async c => {
  try {
    const { handle } = await import("./endpoints/subscription/status_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/auth/oauth_authorize',async c => {
  try {
    const { handle } = await import("./endpoints/auth/oauth_authorize_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/compliance/logs',async c => {
  try {
    const { handle } = await import("./endpoints/admin/compliance/logs_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/compliance/stats',async c => {
  try {
    const { handle } = await import("./endpoints/admin/compliance/stats_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/compliance/check-fal-license',async c => {
  try {
    const { handle } = await import("./endpoints/admin/compliance/checkFalLicense_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/compliance/ejar-mirror',async c => {
  try {
    const { handle } = await import("./endpoints/admin/compliance/ejarMirror_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/compliance/checklist',async c => {
  try {
    const { handle } = await import("./endpoints/admin/compliance/checklist_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/properties/list',async c => {
  try {
    const { handle } = await import("./endpoints/admin/properties/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/ledger/asset-controls',async c => {
  try {
    const { handle } = await import("./endpoints/ledger/asset-controls_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/ledger/contract-rules',async c => {
  try {
    const { handle } = await import("./endpoints/ledger/contract-rules_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/properties/ai_report',async c => {
  try {
    const { handle } = await import("./endpoints/properties/ai_report_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/subscription/upgrade',async c => {
  try {
    const { handle } = await import("./endpoints/subscription/upgrade_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/user/cancel_deletion',async c => {
  try {
    const { handle } = await import("./endpoints/user/cancel_deletion_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/ledger/contract-rules',async c => {
  try {
    const { handle } = await import("./endpoints/ledger/contract-rules_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/ledger/global-controls',async c => {
  try {
    const { handle } = await import("./endpoints/ledger/global-controls_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/user/request_deletion',async c => {
  try {
    const { handle } = await import("./endpoints/user/request_deletion_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/auth/establish_session',async c => {
  try {
    const { handle } = await import("./endpoints/auth/establish_session_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/properties/chat/delete',async c => {
  try {
    const { handle } = await import("./endpoints/properties/chat/delete_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/kyc/status',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/kyc/status_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/properties/delete',async c => {
  try {
    const { handle } = await import("./endpoints/admin/properties/delete_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/properties/update',async c => {
  try {
    const { handle } = await import("./endpoints/admin/properties/update_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/subscriptions/list',async c => {
  try {
    const { handle } = await import("./endpoints/admin/subscriptions/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/tokenization/stats',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/stats_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/ledger/emergency/freeze',async c => {
  try {
    const { handle } = await import("./endpoints/ledger/emergency/freeze_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/properties/email_report',async c => {
  try {
    const { handle } = await import("./endpoints/properties/email_report_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/tokenization/kyc/submit',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/kyc/submit_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/wallet/info',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/wallet/info_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/auth/login_with_password',async c => {
  try {
    const { handle } = await import("./endpoints/auth/login_with_password_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/subscription/buy_reports',async c => {
  try {
    const { handle } = await import("./endpoints/subscription/buy_reports_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/request/list',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/request/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/subscriptions/update',async c => {
  try {
    const { handle } = await import("./endpoints/admin/subscriptions/update_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/tokenization/kyc/list',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/kyc/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/properties/toggle_favorite',async c => {
  try {
    const { handle } = await import("./endpoints/properties/toggle_favorite_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/offerings/list',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/offerings/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/tokenization/secondary/buy',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/secondary/buy_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/auth/register_with_password',async c => {
  try {
    const { handle } = await import("./endpoints/auth/register_with_password_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/tokenization/request/submit',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/request/submit_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/tokenization/wallet/deposit',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/wallet/deposit_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/portfolio/income',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/portfolio/income_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/tokenization/wallet/withdraw',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/wallet/withdraw_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/tokenization/kyc/update',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/kyc/update_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/offerings/details',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/offerings/details_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/tokenization/offerings/invest',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/offerings/invest_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/tokenization/secondary/create',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/secondary/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/portfolio/holdings',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/portfolio/holdings_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/secondary/listings',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/secondary/listings_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/tokenization/requests/list',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/requests/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/tokenization/wallet/transactions',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/wallet/transactions_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.get('_api/admin/tokenization/offerings/list',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/offerings/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/tokenization/requests/review',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/requests/review_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/tokenization/offerings/create',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/offerings/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/tokenization/offerings/update',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/offerings/update_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/tokenization/compliance/acknowledge',async c => {
  try {
    const { handle } = await import("./endpoints/tokenization/compliance/acknowledge_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
app.post('_api/admin/tokenization/income/distribute',async c => {
  try {
    const { handle } = await import("./endpoints/admin/tokenization/income/distribute_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message,  500)
  }
})
// ============================================================
// Smart Rent Management Module Endpoints
// ============================================================
app.get('_api/rent/units/list',async c => {
  try {
    const { handle } = await import("./endpoints/rent/units/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/units/create',async c => {
  try {
    const { handle } = await import("./endpoints/rent/units/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/contracts/list',async c => {
  try {
    const { handle } = await import("./endpoints/rent/contracts/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/contracts/create',async c => {
  try {
    const { handle } = await import("./endpoints/rent/contracts/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/contracts/update',async c => {
  try {
    const { handle } = await import("./endpoints/rent/contracts/update_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/invoices/list',async c => {
  try {
    const { handle } = await import("./endpoints/rent/invoices/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/invoices/generate',async c => {
  try {
    const { handle } = await import("./endpoints/rent/invoices/generate_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/invoices/mark-paid',async c => {
  try {
    const { handle } = await import("./endpoints/rent/invoices/mark-paid_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/payments/list',async c => {
  try {
    const { handle } = await import("./endpoints/rent/payments/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/payments/record',async c => {
  try {
    const { handle } = await import("./endpoints/rent/payments/record_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/payment/create-link',async c => {
  try {
    const { handle } = await import("./endpoints/rent/payment/create-link_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/payment/webhook',async c => {
  try {
    const { handle } = await import("./endpoints/rent/payment/webhook_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/expenses/list',async c => {
  try {
    const { handle } = await import("./endpoints/rent/expenses/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/expenses/create',async c => {
  try {
    const { handle } = await import("./endpoints/rent/expenses/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/ownership/list',async c => {
  try {
    const { handle } = await import("./endpoints/rent/ownership/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/ownership/create',async c => {
  try {
    const { handle } = await import("./endpoints/rent/ownership/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/allocations/list',async c => {
  try {
    const { handle } = await import("./endpoints/rent/allocations/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/allocations/calculate',async c => {
  try {
    const { handle } = await import("./endpoints/rent/allocations/calculate_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/distributions/list',async c => {
  try {
    const { handle } = await import("./endpoints/rent/distributions/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.post('_api/rent/distributions/create',async c => {
  try {
    const { handle } = await import("./endpoints/rent/distributions/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/reports/summary',async c => {
  try {
    const { handle } = await import("./endpoints/rent/reports/summary_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/reports/property-income',async c => {
  try {
    const { handle } = await import("./endpoints/rent/reports/property-income_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/reports/export-csv',async c => {
  try {
    const { handle } = await import("./endpoints/rent/reports/export-csv_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/tenant/invoices',async c => {
  try {
    const { handle } = await import("./endpoints/rent/tenant/invoices_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/tenant/contracts',async c => {
  try {
    const { handle } = await import("./endpoints/rent/tenant/contracts_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/tenant/payments',async c => {
  try {
    const { handle } = await import("./endpoints/rent/tenant/payments_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/investor/allocations',async c => {
  try {
    const { handle } = await import("./endpoints/rent/investor/allocations_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/investor/distributions',async c => {
  try {
    const { handle } = await import("./endpoints/rent/investor/distributions_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})
app.get('_api/rent/investor/properties',async c => {
  try {
    const { handle } = await import("./endpoints/rent/investor/properties_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})

app.get('_api/rent/public/units',async c => {
  try {
    const { handle } = await import("./endpoints/rent/public/units_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})

app.post('_api/rent/tenant/apply',async c => {
  try {
    const { handle } = await import("./endpoints/rent/tenant/apply_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})

app.post('_api/rent/members/add',async c => {
  try {
    const { handle } = await import("./endpoints/rent/members/add_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})

app.get('_api/rent/my-properties',async c => {
  try {
    const { handle } = await import("./endpoints/rent/members/my-properties_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response) && response.constructor.name !== "Response") {
      return c.text("Invalid response format. handle should always return a Response object." + response.constructor.name, 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    return c.text("Error loading endpoint code " + e.message, 500);
  }
})

app.get('_api/admin/work-history',async c => {
  try { const { handle } = await import("./endpoints/admin/work-history_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/admin/role-assignments',async c => {
  try { const { handle } = await import("./endpoints/admin/role-assignments/list_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.post('_api/admin/role-assignments/assign',async c => {
  try { const { handle } = await import("./endpoints/admin/role-assignments/assign_POST.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.post('_api/admin/role-assignments/revoke',async c => {
  try { const { handle } = await import("./endpoints/admin/role-assignments/revoke_POST.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/notifications',async c => {
  try { const { handle } = await import("./endpoints/notifications/list_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.post('_api/notifications/mark-read',async c => {
  try { const { handle } = await import("./endpoints/notifications/mark-read_POST.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/dashboard/stats',async c => {
  try { const { handle } = await import("./endpoints/dashboard/stats_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.post('_api/admin/users/suspend',async c => {
  try { const { handle } = await import("./endpoints/admin/users/suspend_POST.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.post('_api/admin/users/activate',async c => {
  try { const { handle } = await import("./endpoints/admin/users/activate_POST.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/subscriptions/plans',async c => {
  try { const { handle } = await import("./endpoints/subscriptions/plans_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/subscriptions/services',async c => {
  try { const { handle } = await import("./endpoints/subscriptions/services_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/subscriptions/me',async c => {
  try { const { handle } = await import("./endpoints/subscriptions/me_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/subscriptions/check-feature',async c => {
  try { const { handle } = await import("./endpoints/subscriptions/check-feature_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/cron/rent-checks',async c => {
  try { const { handle } = await import("./endpoints/cron/rent-checks_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.get('_api/admin/pricing',async c => {
  try { const { handle } = await import("./endpoints/admin/pricing_GET.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.post('_api/admin/pricing',async c => {
  try { const { handle } = await import("./endpoints/admin/pricing_POST.js"); let request = c.req.raw; const response = await handle(request); if (!(response instanceof Response) && response.constructor.name !== "Response") { return c.text("Invalid response format." + response.constructor.name, 500); } return response; } catch (e) { console.error(e); return c.text("Error loading endpoint code " + e.message, 500); }
})

app.use("/*", serveStatic({ root: "./static" }));
app.use('/*', serveStatic({ root: './dist' }))
app.get("*", async (c, next) => {
  const p = c.req.path;
  if (p.startsWith("/_api")) {
    return next();
  }
  return serveStatic({ path: "./dist/index.html" })(c, next);
});
const port = Number(process.env.PORT || 3333);
export { app };

// ============================================================
// Cron Jobs (node-cron) — Scheduled Tasks
// ============================================================

// Midnight Riyadh time (UTC+3) = 21:00 UTC
cron.schedule("0 21 * * *", async () => {
  console.log("[cron] Running midnight rent-checks scan (Riyadh time)...");
  try {
    const { handle } = await import("./endpoints/cron/rent-checks_GET.js");
    const request = new Request("http://localhost/_api/cron/rent-checks", {
      headers: {
        "authorization": `Bearer ${process.env.CRON_SECRET || "sknai-cron-2024"}`,
        "x-vercel-cron": "true",
      },
    });
    const response = await handle(request);
    const body = await response.text();
    console.log(`[cron] rent-checks complete (${response.status}): ${body}`);
  } catch (err: any) {
    console.error("[cron] rent-checks failed:", err.message);
  }
}, {
  scheduled: true,
  timezone: "Asia/Riyadh",
});

console.log("[cron] Scheduled: midnight daily rent-checks (Asia/Riyadh)");

if (!process.env.VERCEL) {
  serve({ fetch: app.fetch, port });
  console.log(`Running at http://localhost:${port}`)
}
      
