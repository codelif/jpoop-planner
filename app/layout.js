import { Roboto, Roboto_Mono } from "next/font/google";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { themeColors } from "./lib/theme-colors";

// const sans = Roboto({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   weight: ["100", "300", "400", "500", "700", "900"]
// });
const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "300", "700"],
});

const mono = Roboto_Mono({
  variable: ["--font-roboto-mono"],
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: themeColors.dark },
  ],
  colorScheme: "light dark",
};

export const metadata = {
  title: "JIIT Planner",
  description:
    "Quickly view your upcoming events, lectures, tutorial, etc at JIIT ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JIIT Planner",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-title" content="JIIT Planner" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#ffffff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#09090b"
        />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "0a9642b5f0d144f5bc128335e601712f"}'
        ></script>
      </head>
      <body
        className={`${sans.className} antialiased overscroll-none overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
