import type { AccountabilityPaymentLink } from "./types.ts";

const BUY_ME_A_COFFEE_HOST = "buymeacoffee.com";
const PROFILE_PATH = /^\/[A-Za-z0-9._-]{1,100}\/?$/;

function parsePublicHttpsUrl(input: unknown): URL {
  if (typeof input !== "string" || input.length > 512) {
    throw new TypeError("Payment link must be a valid public URL.");
  }

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new TypeError("Payment link must be a valid public URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("Payment link contains unsupported URL fields.");
  }
  return url;
}

export function validateAccountabilityPaymentLink(
  input: unknown,
): AccountabilityPaymentLink {
  const url = parsePublicHttpsUrl(input);
  const hostname = url.hostname.toLowerCase();
  if (hostname !== BUY_ME_A_COFFEE_HOST || !PROFILE_PATH.test(url.pathname)) {
    throw new TypeError("Only a Buy Me a Coffee creator page is allowed.");
  }
  return Object.freeze({ provider: "buy-me-a-coffee", url: url.href.replace(/\/$/, "") });
}
