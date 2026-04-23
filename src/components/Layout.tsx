import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <Navbar />
      <main className="flex-grow flex flex-col pt-0">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
