// app/layout.tsx

import './globals.css';
import { Montserrat } from 'next/font/google';
import { ConfirmDialogRoot } from '../components/feedback/ConfirmOption'; // importa aquí
// import NavigationLoader from '@/components/feedback/NavegationLoader';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
});

export const metadata = {
  title: 'Quality Soft Service',
  description: 'Quality Soft Service SAS',
  icons: {
    icon: '/flavicon.webp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body suppressHydrationWarning={true}>
        {children}
        {/* <NavigationLoader /> */}

        <ConfirmDialogRoot />
      </body>
    </html>
  );
}
