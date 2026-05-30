import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PloroAI",
    short_name: "PloroAI",
    description:
      "AI-assisted electrical quotes from floor plans and project documentation.",
    start_url: "/hr",
    scope: "/",
    display: "standalone",
    background_color: "#010223",
    theme_color: "#080cf7",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/icon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
