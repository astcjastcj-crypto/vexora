import "./globals.css";

export const metadata = {
  title: "VEXORA — Tu acceso a lo digital",
  description: "VEXORA: Tu acceso a lo digital.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
