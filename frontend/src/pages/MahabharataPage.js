import React from 'react';

function MahabharataPage() {
  const buttonClasses = "inline-block px-6 py-3 my-2 mr-2 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

  return (
    <div className="container mx-auto px-4 text-center py-8">
      <h1 className="text-4xl font-bold mb-4">Mahabharata Interactive (DharmaVerse)</h1>
      <p className="text-lg text-gray-700 mb-2">This is where the interactive Mahabharata experience will live.</p>
      <p className="text-lg text-gray-700 mb-8">Explore the epic like never before!</p>

      <div id="preview" className="my-8 p-6 bg-gray-100 rounded-lg shadow">
        <h3 className="text-2xl font-semibold mb-3">Chapter Preview Area</h3>
        <p className="text-gray-600"><em>First chapter preview content will appear here soon.</em></p>
      </div>

      <section className="my-12 p-8 border border-gray-300 rounded-lg bg-white shadow-md">
        <h3 className="text-2xl font-semibold mb-4">Interested in the Full Experience?</h3>
        <p className="text-gray-700 mb-6">Join the DharmaVerse waiting list to get notified when we launch and receive exclusive updates!</p>
        <form className="my-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Enter your email"
            className="p-3 mr-2 text-gray-800 border border-gray-300 rounded-md sm:min-w-[250px] focus:ring-blue-500 focus:border-blue-500"
          />
          <button type="submit" className={buttonClasses}>Join Waitlist</button>
        </form>
      </section>
    </div>
  );
}

export default MahabharataPage;
