import React from 'react';
import { Link } from 'react-router-dom'; // For buttons

function HomePage() {
  // Tailwind classes for styling
  const sectionClasses = "p-8 my-8 border border-gray-200 rounded-lg bg-gray-50";
  const buttonClasses = "inline-block px-6 py-3 my-2 mr-2 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
  const greenButtonClasses = "inline-block px-6 py-3 my-2 mr-2 text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500";
  const benefitsListStyle = { // list-style-type: '✅' is tricky with Tailwind alone, keeping for now or use SVG
    listStyleType: '✅',
    paddingLeft: '20px'
  };


  return (
    <div className="container mx-auto px-4">
      <header className="text-center my-8">
        <h1 className="text-5xl font-bold">RapidBytes</h1>
        <h2 className="text-2xl text-gray-600 mt-2">Interactive Dharma Experiences</h2>
      </header>

      {/* Epic Experience Section */}
      <section className={`${sectionClasses} bg-blue-50 text-center`}>
        <h2 className="text-3xl font-semibold mb-4">🚀 RapidBytes Presents: DharmaVerse</h2>
        <p className="text-xl italic text-gray-700 mb-4">A new kind of experience.</p>
        <p className="text-lg mb-6">
          The Mahabharata reimagined as a gamified, interactive, visual storytelling journey—where you don’t just read the epic… you live it.
        </p>
        <div>
          <form className="my-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email to join the waitlist"
              className="p-3 mr-2 text-gray-800 border border-gray-300 rounded-md sm:min-w-[250px] focus:ring-blue-500 focus:border-blue-500"
            />
            <button type="submit" className={buttonClasses}>👉 Join the Waitlist</button>
          </form>
          <Link to="/mahabharata#preview" className={greenButtonClasses}>🎬 Preview the First Chapter</Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={sectionClasses}>
        <h3 className="text-2xl font-semibold mb-4">Why it works (Benefits of Using RapidBytes Now):</h3>
        <ul style={benefitsListStyle} className="space-y-2">
          <li><strong>Already live:</strong> No delay from domain/hosting/SEO setup</li>
          <li><strong>Flexible brand:</strong> “Bytes” gives techy-meets-culture vibes</li>
          <li><strong>SEO-ready:</strong> You already have indexed pages</li>
          <li><strong>Multi-brand potential:</strong> You can launch 3+ story projects in the future under one roof</li>
          <li><strong>Launch faster:</strong> Add content, build list, get feedback—all in weeks</li>
        </ul>
      </section>

      {/* Placeholder for other content lanes if needed on homepage */}
      {/*
      <section style={sectionStyle}>
        <h3>Explore Our Content Lanes</h3>
        <p><Link to="/future-bytes">FutureBytes (AI, Biohacking)</Link></p>
        <p><Link to="/code-bytes">CodeBytes (Dev tools)</Link></p>
      </section>
      */}
    </div>
  );
}

export default HomePage;
