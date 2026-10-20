import type { Metadata } from "next";
import { Providers } from "./providers";
import "./design-overlay.css";

export const metadata: Metadata = {
  title: "Sentinel — infra diagnostics console",
  description:
    "A simulated on-call console: paste an infrastructure alert, read the agent's ranked likely causes with evidence, and approve a fix before anything runs. No real cluster, no credentials.",
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