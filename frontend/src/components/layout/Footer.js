import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white text-center p-6 mt-8">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} RapidBytes. All rights reserved.</p>
        <p className="mt-1 text-sm text-gray-400">Interactive Dharma Experiences</p>
      </div>
    </footer>
  );
}

export default Footer;
