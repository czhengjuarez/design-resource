import type { Context, Next } from "hono";
import type { Env } from "./index";

/**
 * Admin auth middleware.
 *
 * Local dev (ADMIN_BYPASS_LOCAL=true): passes through unconditionally.
 * Production: validates the Cf-Access-Jwt-Assertion header issued by a
 * Cloudflare Access application. Set CF_ACCESS_AUD in Worker secrets to the
 * Access application's audience tag from the Cloudflare dashboard.
 *
 * To wire up Access:
 *   1. Create an Access application for /admin and /api/admin/* in the dashboard.
 *   2. Copy the Application Audience (AUD) tag.
 *   3. wrangler secret put CF_ACCESS_AUD   (paste the AUD value)
 *   4. Remove ADMIN_BYPASS_LOCAL from wrangler.jsonc vars.
 */
export async function adminAuth(
  c: Context<{ Bindings: Env }>,
  next: Next,
) {
  if (c.env.ADMIN_BYPASS_LOCAL === "true") {
    return next();
  }

  const token = c.req.header("Cf-Access-Jwt-Assertion");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const aud = c.env.CF_ACCESS_AUD;
  if (!aud) {
    return c.json({ error: "CF_ACCESS_AUD not configured" }, 500);
  }

  // Validate the JWT against the Cloudflare Access public keys.
  const certsUrl = `https://design-resources.cloudflareaccess.com/cdn-cgi/access/certs`;
  try {
    const resp = await fetch(certsUrl);
    const { keys } = (await resp.json()) as { keys: JsonWebKey[] };

    // Import each key and try to verify.
    for (const jwk of keys) {
      try {
        const key = await crypto.subtle.importKey(
          "jwk",
          jwk,
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"],
        );
        const [, payloadB64, sigB64] = token.split(".");
        const data = new TextEncoder().encode(`${token.split(".")[0]}.${payloadB64}`);
        const sig = Uint8Array.from(
          atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0),
        );
        const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
        if (valid) {
          const payload = JSON.parse(atob(payloadB64)) as { aud: string[] };
          if (Array.isArray(payload.aud) && payload.aud.includes(aud)) {
            return next();
          }
        }
      } catch {
        // try next key
      }
    }
  } catch {
    return c.json({ error: "Auth service unreachable" }, 502);
  }

  return c.json({ error: "Forbidden" }, 403);
}
