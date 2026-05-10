import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nusantara Culinary Alchemist',
  description: 'A web-based crafting game for Nusantara Culinary Alchemist.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#fdfaf1] text-[#222] font-serif border-8 border-[#3a2d28] overflow-hidden relative" suppressHydrationWarning>
        <div className="absolute inset-0 opacity-5 pointer-events-none -z-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/handmade-paper.png')" }}></div>
        {children}
      </body>
    </html>
  );
}
