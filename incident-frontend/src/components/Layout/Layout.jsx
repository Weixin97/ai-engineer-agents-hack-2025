
import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header />
      <main style={{ width: '100%' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;