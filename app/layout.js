import "./globals.css";

export const metadata = {
  title: "VEXORA — Tu acceso a lo digital",
  description: "VEXORA: Tu acceso a lo digital. Descubre accesos digitales de IA, streaming, gaming, productividad y diseño.",
  applicationName: "VEXORA",
  keywords: ["VEXORA", "productos digitales", "IA", "streaming", "gaming", "productividad", "diseño"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "VEXORA — Tu acceso a lo digital",
    description: "Accesos digitales seleccionados para ti.",
    type: "website",
    locale: "es_PE",
    siteName: "VEXORA",
  },
  twitter: {
    card: "summary",
    title: "VEXORA — Tu acceso a lo digital",
    description: "Accesos digitales seleccionados para ti.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05070c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
