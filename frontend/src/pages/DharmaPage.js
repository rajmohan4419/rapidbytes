import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function DharmaPage() {
  return (
    <div>
      <h1>Dharma Lessons & Quizzes</h1>
      <p>This section will contain Dharma lessons and quizzes.</p>
      <nav>
        <ul>
          <li><Link to="lessons">Lessons</Link></li>
          <li><Link to="quizzes">Quizzes</Link></li>
        </ul>
      </nav>
      <hr />
      <Outlet /> {/* This is where nested route components will be rendered */}
    </div>
  );
}

export default DharmaPage;
