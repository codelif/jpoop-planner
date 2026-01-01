import { themeColors } from "./lib/theme-colors";

export default function manifest() {
  return {
    name: "JIIT Planner",
    short_name: "Planner",
    description: "View your classes and manage your schedule at JIIT",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColors.light,
    theme_color_dark: themeColors.dark,
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
