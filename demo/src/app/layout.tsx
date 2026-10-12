import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Sentinel — Infra Diagnostics Console",
  description:
    "Simulated Microsoft Fluent console for the infra-diagnostics-agent: alert triage, approval gates, and Slack signature verification. No real cluster, no credentials.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
