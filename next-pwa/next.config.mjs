import withPWA from "next-pwa";
import rehypePrism from "@mapbox/rehype-prism";
import nextMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ["i.pravatar.cc", "images.unsplash.com"] },
  pageExtensions: ["ts", "tsx", "mdx"],
};

const withMDXConfig = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
});

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(withMDXConfig(nextConfig));
