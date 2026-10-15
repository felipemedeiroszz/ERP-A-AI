import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { getAppearanceSettings, getCompanySettings } from "@/lib/settings";
import { StoreProviders } from "@/components/store/store-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERP Açaiteria",
  description: "Sistema de gestão, PDV e delivery para açaiteria",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [appearance, company] = await Promise.all([
    getAppearanceSettings().catch(() => null),
    getCompanySettings().catch(() => null),
  ]);

  const primary = appearance?.primaryColor || "#6B21A8";
  const secondary = appearance?.secondaryColor || "#8B5CF6";
  const accent = appearance?.accentColor || "#A855F7";
  const button = appearance?.buttonColor || "#6B21A8";

  return (
    <html lang="pt-BR">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${hexToHsl(primary)};
                --primary-foreground: 0 0% 98%;
                --secondary: ${hexToHsl(secondary)};
                --secondary-foreground: 0 0% 98%;
                --accent: ${hexToHsl(accent)};
                --accent-foreground: 0 0% 98%;
                --ring: ${hexToHsl(button)};
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <StoreProviders>{children}</StoreProviders>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "0.75rem",
            },
          }}
        />
      </body>
    </html>
  );
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "271 71% 39%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
