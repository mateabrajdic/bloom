import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://bloom-rose-kappa.vercel.app"),
  title: "Petalpost - Send Flowers",
  description: "Customize a bouquet and send a message.",
  openGraph: {
    title: "Petalpost - Send Flowers",
    description: "Customize a bouquet and send a message.",
    images: ["/petalpost-og.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Petalpost - Send Flowers",
    description: "Customize a bouquet and send a message.",
    images: ["/petalpost-og.svg"],
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
