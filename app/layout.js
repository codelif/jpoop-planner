import { Roboto, Roboto_Mono } from "next/font/google";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";

// const sans = Roboto({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   weight: ["100", "300", "400", "500", "700", "900"]
// });
const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "300", "700"]
})

const mono = Roboto_Mono({
  variable: ["--font-roboto-mono"],
  subsets: ["latin"],
});

export const metadata = {
  title: "JIIT Planner",
  description: "Quickly view your upcoming events, lectures, tutorial, etc at JIIT ",
  // Add mobile-specific metadata
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: 'no'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "JIIT Planner"
  },
  formatDetection: {
    telephone: false
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="JIIT Planner" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${sans.className} antialiased overscroll-y-none`}
      >
        <Analytics />
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
