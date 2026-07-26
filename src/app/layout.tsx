import type { Metadata } from 'next';
import './globals.css';
import MetaPixel from '@/components/MetaPixel';

export const metadata: Metadata = {
  title: 'Van Bazer BD - সেরা দামে প্রিমিয়াম প্রোডাক্ট',
  description: 'অর্ডার করতে নিচে নাম ও ঠিকানা দিয়ে অর্ডার কনফার্ম করুন। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।',
  openGraph: {
    title: 'Van Bazer BD - সেরা দামে প্রিমিয়াম প্রোডাক্ট',
    description: 'অর্ডার করতে নিচে নাম ও ঠিকানা দিয়ে অর্ডার কনফার্ম করুন।',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="font-['Hind_Siliguri',sans-serif] bg-slate-950 text-slate-100 min-h-screen selection:bg-rose-500 selection:text-white">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
