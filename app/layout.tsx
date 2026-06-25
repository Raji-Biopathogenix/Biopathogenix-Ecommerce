import { Metadata } from 'next';
import './globals.css'
import Header from '@/components/layout/header/HeaderWrapper';
import Footer from '@/components/layout/footer/Footer';
import ChatWidget from '@/components/chat/ChatWidget';
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from '@/context/ToastContext';

config.autoAddCss = false;

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
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
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
