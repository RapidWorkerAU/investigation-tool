import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Investigation Tool",
    short_name: "Investigation Tool",
    description: "Incident investigation canvas platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ecebe7",
    theme_color: "#ecebe7",
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
