import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page Components
import HomePage from './pages/HomePage';
import MahabharataPage from './pages/MahabharataPage';
import DharmaPage from './pages/DharmaPage'; // For /dharma parent route
import FutureBytesPage from './pages/FutureBytesPage';
import CodeBytesPage from './pages/CodeBytesPage';
import BlogPage from './pages/BlogPage';

// Placeholder components for sub-routes of /dharma
const DharmaLessonsPage = () => <div><h2>Dharma Lessons</h2><p>Coming soon...</p></div>;
const DharmaQuizzesPage = () => <div><h2>Dharma Quizzes</h2><p>Coming soon...</p></div>;

// Placeholder for /projects/otherBytes - for now, not creating a specific page for this
// as FutureBytes and CodeBytes cover the project lanes.

function App() {
  // TODO: Initialize basic session logging and analytics tracker here
  return (
    <Router>
      <div className="App flex flex-col min-h-screen"> {/* Ensure App takes full height and enables flex column layout */}
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-6"> {/* flex-grow allows main to take available space, basic padding and container */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/mahabharata" element={<MahabharataPage />} />
            <Route path="/dharmaverse" element={<MahabharataPage />} /> {/* Alias for mahabharata */}

            <Route path="/dharma" element={<DharmaPage />}>
              {/* Nested routes for /dharma */}
              <Route path="lessons" element={<DharmaLessonsPage />} />
              <Route path="quizzes" element={<DharmaQuizzesPage />} />
            </Route>
            {/* <Route path="/dharma/lessons" element={<DharmaLessonsPage />} /> */} {/* Removed as now nested */}
            {/* <Route path="/dharma/quizzes" element={<DharmaQuizzesPage />} /> */} {/* Removed as now nested */}

            <Route path="/future-bytes" element={<FutureBytesPage />} />
            <Route path="/code-bytes" element={<CodeBytesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            {/*
              The request mentioned /projects/otherBytes.
              Given FutureBytes and CodeBytes are specific project lanes,
              it's unclear if a generic /projects/otherBytes is still needed.
              If it is, a new component for it would be created.
              For now, mapping /projects to HomePage or a new ProjectsLandingPage if desired.
              Let's make /projects an alias for FutureBytes for now as an example.
            */}
            <Route path="/projects" element={<FutureBytesPage />} />
            <Route path="/projects/otherbytes" element={<FutureBytesPage />} />


            {/* Add a catch-all or 404 page later if needed */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
