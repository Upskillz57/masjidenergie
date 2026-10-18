import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/espace", "/compte", "/connexion", "/auth"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
