import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@teispace/next-themes";
import { getTheme, getThemeScript } from "@teispace/next-themes/server";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME, APP_DESCRIPTION } from "@/constants";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const themeProviderConfig = {
  attribute: "class" as const,
  defaultTheme: "light",
  enableSystem: true,
  disableTransitionOnChange: true,
};

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialTheme = await getTheme();
  const themeScript = getThemeScript({
    attribute: themeProviderConfig.attribute,
    defaultTheme: themeProviderConfig.defaultTheme,
    enableSystem: themeProviderConfig.enableSystem,
    initialTheme: initialTheme ?? undefined,
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${outfit.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider {...themeProviderConfig} initialTheme={initialTheme ?? undefined} noScript>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
