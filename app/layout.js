import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://bloom-rose-kappa.vercel.app"),
  title: "FlowerNote - Send Flowers",
  description: "Customize a bouquet and send a message.",
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/favicon_io/site.webmanifest",
  openGraph: {
    title: "FlowerNote - Send Flowers",
    description: "Customize a bouquet and send a message.",
    images: ["/petalpost-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowerNote - Send Flowers",
    description: "Customize a bouquet and send a message.",
    images: ["/petalpost-og.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
