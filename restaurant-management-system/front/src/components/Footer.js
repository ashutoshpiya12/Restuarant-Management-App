import React from 'react';

export default function Footer() {
  return (
    <footer className="site-footer py-4 mt-5">
      <div className="container d-flex flex-wrap justify-content-between small">
        <span>&copy; {new Date().getFullYear()} Acme Restaurant Kitchen</span>
        <span>Open daily · 11:00 – 22:00</span>
      </div>
    </footer>
  );
}
