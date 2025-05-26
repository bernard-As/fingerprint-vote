import React from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage'; // Import the new page
import AdminDashboardPage from './pages/AdminDashboardPage'; // Make sure this path is correct
import VotingPage from './pages/VotingPage';


const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/vote" element={<VotingPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        {/*
          Example of future routes:
          <Route path="/vote" element={<VotingPage />} />
          <Route path="/participants/:participantId" element={<ParticipantDetailPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} /> // Future admin dashboard
        */}

        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 text-neutral-light-text p-6 text-center">
              <h1 className="text-5xl font-bold mb-4">404</h1>
              <p className="text-2xl mb-8">Oops! Page Not Found.</p>
              <p className="text-lg mb-8">
                The page you are looking for might have been removed, had its name changed,
                or is temporarily unavailable.
              </p>
              <RouterLink
                to="/"
                className="
                  bg-accent-teal text-navy-primary font-semibold
                  text-lg
                  py-3 px-8
                  rounded-lg shadow-md
                  hover:bg-accent-teal-dark transition-colors duration-300 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-opacity-75
                  min-h-[48px] min-w-[48px]
                "
              >
                Go to Homepage
              </RouterLink>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
