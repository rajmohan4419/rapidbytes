import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const linkClasses = "text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium";
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <Link to="/" className="text-white text-xl font-bold hover:text-gray-300">RapidBytes</Link>
        </div>
        <ul className="flex space-x-4">
          <li><Link to="/" className={linkClasses}>Home</Link></li>
          <li><Link to="/mahabharata" className={linkClasses}>DharmaVerse</Link></li>
          <li><Link to="/future-bytes" className={linkClasses}>FutureBytes</Link></li>
          <li><Link to="/code-bytes" className={linkClasses}>CodeBytes</Link></li>
          <li><Link to="/blog" className={linkClasses}>Blog</Link></li>
          {/* Consider a dropdown for Dharma sub-items if navbar gets crowded */}
          <li><Link to="/dharma" className={linkClasses}>Dharma</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
