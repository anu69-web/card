/**
 * ============================================================================
 * Cloudflare Worker: Cookie Asset Gate & Offline Tunnel Fallback
 * ============================================================================
 * Features:
 * 1. Media Asset Protection Gate:
 *    - Intercepts requests to `/assets/` or protected media files (.mp3, .jpg, .png, etc.).
 *    - Strictly checks for `auth_unlocked=true` in the `Cookie` header.
 *    - Returns 403 Forbidden ("403 Unauthorized Asset Access") if cookie is missing.
 *
 * 2. Origin Reverse Proxy:
 *    - Passes authorized and standard web requests directly to origin / Cloudflare Tunnel.
 *
 * 3. Offline / Tunnel Error Fallback:
 *    - Catches network exceptions, 502/503/504 errors, and Cloudflare Error 1033.
 *    - Serves a self-contained dark maintenance UI with live reconnect polling.
 * ============================================================================
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();
    const cookieHeader = request.headers.get("Cookie") || "";

    // ------------------------------------------------------------------------
    // 1. MEDIA PROTECTION GATE
    // ------------------------------------------------------------------------
    // Match protected media extensions or /assets/ folder
    const isProtectedMedia = 
      pathname.startsWith("/assets/") ||
      /\.(mp3|wav|ogg|m4a|png|jpg|jpeg|webp|gif|svg|mp4|webm|mov)$/i.test(pathname);

    // List of public lockscreen assets allowed without auth (e.g., favicon)
    const isPublicExempt = pathname === "/favicon.ico";

    if (isProtectedMedia && !isPublicExempt) {
      const hasAuthCookie = cookieHeader
        .split(";")
        .some(c => c.trim() === "auth_unlocked=true" || c.trim().startsWith("auth_unlocked="));

      if (!hasAuthCookie) {
        return new Response("403 Unauthorized Asset Access", {
          status: 403,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "X-Robots-Tag": "noindex, nofollow"
          }
        });
      }
    }

    // ------------------------------------------------------------------------
    // 2. REVERSE PROXY & TUNNEL FALLBACK
    // ------------------------------------------------------------------------
    try {
      const response = await fetch(request);

      // Check for gateway/origin error status codes
      if ([502, 503, 504].includes(response.status)) {
        return renderOfflineFallback(response.status);
      }

      // Check for Cloudflare Tunnel Error 1033 in HTML body
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("text/html") && !response.ok) {
        const text = await response.clone().text();
        if (text.includes("error 1033") || text.includes("argo tunnel error")) {
          return renderOfflineFallback(1033);
        }
      }

      return response;
    } catch (err) {
      // Tunnel offline / Network unreachable
      return renderOfflineFallback(503);
    }
  }
};

/**
 * Self-Contained Dark Mode Maintenance & Offline Fallback UI
 */
function renderOfflineFallback(statusCode = 503) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Temporarily Offline | Connecting...</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0d1117;
      color: #f0f6fc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 1.25rem;
      text-align: center;
    }
    .offline-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 16px;
      padding: 2.5rem 2rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .pulse-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pulse-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(244, 63, 94, 0.35);
      border-radius: 50%;
      animation: pulse 2s ease-out infinite;
    }
    .pulse-icon {
      font-size: 2rem;
      z-index: 2;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    h1 {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    p {
      color: #8b949e;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 9999px;
      padding: 0.35rem 0.85rem;
      font-size: 0.78rem;
      font-family: monospace;
      color: #ff7b72;
    }
    .retry-btn {
      background: #238636;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.65rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
      margin-top: 0.5rem;
    }
    .retry-btn:hover { background: #2ea043; }
    .auto-retry-text {
      font-size: 0.75rem;
      color: #6e7681;
    }
  </style>
</head>
<body>
  <div class="offline-card">
    <div class="pulse-wrapper">
      <div class="pulse-glow"></div>
      <div class="pulse-icon">⚡</div>
    </div>

    <h1>Tunnel Connecting</h1>
    
    <p>The host server or tunnel is currently initializing or reconnecting. The page will automatically refresh as soon as the connection is restored.</p>

    <div class="status-badge">
      <span>●</span>
      <span>STATUS: ${statusCode} (ORIGIN_UNREACHABLE)</span>
    </div>

    <button class="retry-btn" onclick="window.location.reload()">Retry Connection</button>

    <span class="auto-retry-text" id="retryCounter">Auto-checking in 5s...</span>
  </div>

  <script>
    let countdown = 5;
    const label = document.getElementById("retryCounter");
    setInterval(() => {
      countdown--;
      if (label) label.textContent = "Auto-checking in " + countdown + "s...";
      if (countdown <= 0) {
        window.location.reload();
      }
    }, 1000);
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Retry-After": "5"
    }
  });
}
