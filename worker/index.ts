/** Cloudflare Worker entry point for Doomsday Clock. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const image = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(image, request);
    }

    return withSecurityHeaders(await handler.fetch(request, env, ctx), request);
  },
};

function withSecurityHeaders(response: Response, request: Request): Response {
  const secured = new Response(response.body, response);
  const headers = secured.headers;
  headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://buymeacoffee.com",
    "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://www.youtube.com https://www.youtube-nocookie.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.clerk.com https://i.ytimg.com",
    "font-src 'self' data:",
    "frame-src https://*.clerk.accounts.dev https://*.clerk.com https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.openai.com https://api.anthropic.com http://localhost:11434 http://127.0.0.1:11434 http://localhost:1234 http://127.0.0.1:1234 https://www.youtube.com https://www.youtube-nocookie.com",
    "upgrade-insecure-requests",
  ].join("; "));
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return secured;
}

export default worker;
