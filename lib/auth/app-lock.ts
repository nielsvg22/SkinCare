"use client";

// A local-device app lock using WebAuthn platform authenticators (Face ID /
// Touch ID / Windows Hello). This is intentionally NOT a server-verified
// auth ceremony — Supabase's own session + RLS already protect the actual
// data. This only gates the UI on a device someone might pick up unlocked,
// the same role "app lock" plays in many native apps. The credential is
// created and checked entirely client-side with a locally generated
// challenge, and its id is stored per-device in localStorage.

const CREDENTIAL_KEY = "verzorgingsroutine-lock-credential-id";
const SESSION_UNLOCKED_KEY = "verzorgingsroutine-unlocked";

function bufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}

export async function isAppLockAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isAppLockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(CREDENTIAL_KEY);
}

export function isUnlockedThisSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === "1";
}

export function markUnlockedThisSession() {
  sessionStorage.setItem(SESSION_UNLOCKED_KEY, "1");
}

export async function enableAppLock(accountName: string): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Verzorgingsroutine" },
      user: { id: userId, name: accountName, displayName: accountName },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Aanmaken van vergrendeling is mislukt");

  localStorage.setItem(CREDENTIAL_KEY, bufferToBase64url(credential.rawId));
  markUnlockedThisSession();
}

export function disableAppLock() {
  localStorage.removeItem(CREDENTIAL_KEY);
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
}

export async function verifyAppLock(): Promise<boolean> {
  const storedId = localStorage.getItem(CREDENTIAL_KEY);
  if (!storedId) return false;

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: base64urlToBuffer(storedId), type: "public-key" }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    if (assertion) {
      markUnlockedThisSession();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
