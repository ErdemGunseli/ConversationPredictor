import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { ViewTransitions } from "next-view-transitions";
import { ThemeProvider } from "@/context/theme-provider";
import { UserProvider } from "@/context/UserContext";
import { ToastServiceProvider } from "@/services/ToastServiceProvider";
import SWRegister from "@/components/ui/sw-register";
import { PWAInstallProvider } from "@/context/PWAInstallContext";
import { LanguageProvider } from "@/components/ui/language-selector";
import { GlassesModeProvider } from '@/context/GlassesModeContext';
import { ConversationProvider } from "@/context/ConversationContext";

export const metadata: Metadata = {
  title: "Heard",
  description:
    "Heard transcribes and organizes all of your conversations.",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"], // TODO: REPLACE WITH SCREENSHOT OF DASHBOARD
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#000000" />
          <link rel="apple-touch-icon" href="/placeholder.png" />
        </head>
        <body
          className={cn(
            GeistSans.className,
            "bg-white dark:bg-black antialiased h-full w-full"
          )}
        >
          <SWRegister />

          <ThemeProvider
            attribute="class"
            enableSystem
            disableTransitionOnChange
            defaultTheme="light"
          >
            <LanguageProvider>
              <PWAInstallProvider>
                <UserProvider>
                  <ConversationProvider>
                    <GlassesModeProvider>
                      <ToastServiceProvider>
                        {children}
                      </ToastServiceProvider>
                    </GlassesModeProvider>
                  </ConversationProvider>
                </UserProvider>
              </PWAInstallProvider>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
