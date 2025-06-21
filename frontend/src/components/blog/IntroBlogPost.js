import React from 'react';

function IntroBlogPost() {
  return (
    <article className="prose lg:prose-xl mx-auto p-6 bg-white rounded-lg shadow-md"> {/* Using Tailwind Typography plugin classes if available, or basic styling */}
      <h2 className="text-3xl font-bold mb-4">Why We’re Building the Mahabharata for the Digital Age</h2>
      <p className="text-sm text-gray-500 mb-6"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>

      <p className="mb-4">The Mahabharata is not just a story; it's an epic that has shaped cultures and philosophies for millennia. Its timeless wisdom, complex characters, and profound dilemmas continue to resonate with us today. But in an age of rapid technological advancement and shrinking attention spans, how do we ensure this monumental epic remains accessible and engaging for current and future generations?</p>

      <p className="mb-4">At RapidBytes, under our new DharmaVerse initiative, we believe the answer lies in leveraging the power of digital interactivity. We are embarking on a journey to reimagine the Mahabharata as a gamified, interactive, visual storytelling experience. Our goal is not to merely digitize the text but to create a dynamic world where users don’t just read the epic… they live it.</p>

      <h3 className="text-2xl font-semibold mt-6 mb-3">Why Now?</h3>
      <p className="mb-4">The digital landscape offers unprecedented tools to bring ancient stories to life. From immersive visuals and compelling audio to interactive decision-making and personalized learning paths, technology allows us to engage with narratives in ways previously unimaginable. We believe the time is ripe to apply these innovations to one of humanity's greatest stories.</p>

      <h3 className="text-2xl font-semibold mt-6 mb-3">What to Expect?</h3>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li><strong>Interactive Storytelling:</strong> Make choices that influence your journey through the epic.</li>
        <li><strong>Gamified Learning:</strong> Understand complex dharmic principles through engaging gameplay.</li>
        <li><strong>Visual Spectacle:</strong> Experience the world of the Mahabharata with stunning visuals and art.</li>
        <li><strong>Accessible Wisdom:</strong> Uncover layers of meaning and philosophy at your own pace.</li>
      </ul>

      <h3 className="text-2xl font-semibold mt-6 mb-3">Join Us on This Epic Journey</h3>
      <p className="mb-4">We are just at the beginning of this ambitious project. Building the Mahabharata for the digital age is a monumental task, and we are excited to share our progress, challenges, and learnings with you. We invite you to join our waitlist for the DharmaVerse, follow our blog for updates, and become part of a community dedicated to exploring dharma through the lens of modern technology.</p>
      <p className="mb-4">This is more than just a project for us; it's a passion. It's about bridging ancient wisdom with contemporary technology to create something truly meaningful. We believe that by experiencing the Mahabharata in this new way, users will not only learn about its stories and characters but also gain deeper insights into the timeless principles of dharma that are more relevant than ever in our complex world.</p>

      <p className="mt-6">Stay tuned for more updates!</p>
    </article>
  );
}

export default IntroBlogPost;
