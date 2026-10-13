import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deebug — AI DSA Tutor',
  description:
    'An AI-powered DSA tutor chatbot that teaches concepts without revealing solutions. Practice smarter with guided learning.',
  keywords: ['DSA', 'tutor', 'algorithms', 'data structures', 'LeetCode', 'AI', 'chatbot'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased font-sans selection:bg-orange-100 selection:text-orange-900">
        {children}
      </body>
    </html>
  );
}
