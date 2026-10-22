import { Metadata } from 'next';
import { Poppins } from "next/font/google";
import './globals.css'
import Header from '@/components/layout/header/HeaderWrapper';
import Footer from '@/components/layout/footer/Footer';
import ChatWidget from '@/components/chat/ChatWidget';
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from '@/context/ToastContext';

config.autoAddCss = false;

// The site typeface from the Figma design, used on every page (see --font-brand in globals.css).
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-poppins" });

export const metadata: Metadata = {
  title: 'BioPathogenix',
  description: 'High-quality lab supplies for research',
  icons: {
    icon: '/BioPathogenix-Favicon-1-1-32x32.png',
    apple: '/apple-BioPathogenix-Favicon-1-1-180x180.png', // optional
  },
}



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="site-page bg-white text-gray-900 antialiased">
        <AuthProvider>
          <ToastProvider>
          <Header />
            {children}
            <ChatWidget />
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
