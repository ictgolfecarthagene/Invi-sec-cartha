import "./globals.css";

export const metadata = {
  title: "Interact Portail ICTGC",
  description: "Portail officiel de gestion des invitations",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}