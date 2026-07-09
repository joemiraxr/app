import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "material-symbols/outlined.css";
import "@/styles/main.scss";
import { SessionProvider } from "@/context/session-context";
import { AuthGate } from "@/components/AuthGate";
import { Header } from "@/components/Header";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "ZeroBias v2 Example",
  description:
    "Canonical example of building a custom app on the ZeroBias platform with the v2 client + SDKs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <SessionProvider>
          <AuthGate>
            <Header />
            <main className="content">{children}</main>
          </AuthGate>
        </SessionProvider>
      </body>
    </html>
  );
}
