import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "nl.nielsvg22.verzorgingsroutine",
  appName: "Verzorgingsroutine",
  // This wraps the live deployed app in a native WebView shell rather than
  // bundling a static build — the app relies on server components, server
  // actions, API routes and auth middleware that can't be statically exported.
  webDir: "public",
  server: {
    url: "https://verzorgingsroutine.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
