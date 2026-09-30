import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "My Future World",
  description: "Hanifa's learning and mentoring journey",
  // A private learning app for a young person: keep it out of search engines.
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#d946ef", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{var v=JSON.parse(localStorage.getItem("future-world-vibe"));if(v)document.documentElement.dataset.vibe=v}catch(e){}` }} /></head>
      <body>
        <div className="aurora" aria-hidden><i /><i /><i /></div>
        {children}
      </body>
    </html>
  );
}
