// src/pages/AdminLoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/authService'; // Import the service

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic client-side validation (can be more sophisticated)
    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const { user, error: authError } = await loginAdmin({ email, password });

      if (authError) {
        // Pro-Tip: Map common Supabase auth errors to user-friendly messages.
        // e.g., "Invalid login credentials" often means email/password mismatch.
        throw new Error(authError.message || 'Login failed. Please check your credentials.');
      }

      if (user) {
        console.log('Admin login successful:', user);
        // Navigate to a protected admin dashboard page
        // You would typically set up protected routes that require authentication.
        navigate('/admin/dashboard');
      } else {
        // This case should ideally be caught by authError, but as a fallback:
        throw new Error('Login failed. No user data received.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseStyles = `
    w-full px-4 py-3 rounded-lg bg-almost-white text-navy-primary
    border border-ui-neutral-light focus:outline-none focus:ring-2
    focus:ring-accent-teal focus:border-transparent
    placeholder-ui-neutral-placeholder transition-colors duration-200 ease-in-out
    min-h-[48px]
  `;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy-primary p-4 sm:p-6">
      <div className="w-full max-w-md p-6 sm:p-8 md:p-10 bg-almost-white rounded-xl shadow-2xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy-primary">
            Admin Login
          </h1>
          <p className="text-ui-neutral-medium mt-2"> {/* Using theme color */}
            Access the FingerVote control panel.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ui-neutral-dark mb-1.5" // Using theme color
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBaseStyles}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ui-neutral-dark mb-1.5" // Using theme color
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputBaseStyles}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-status-error bg-status-error-light p-3 rounded-md text-center"> {/* Using theme colors */}
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full flex justify-center items-center
                py-3.5 px-4 border border-transparent rounded-lg shadow-sm
                text-lg font-semibold text-neutral-light-text bg-navy-primary
                hover:bg-opacity-90 focus:outline-none focus:ring-2
                focus:ring-offset-2 focus:ring-navy-primary focus:ring-offset-neutral-light-text
                transition-all duration-300 ease-in-out
                disabled:opacity-60 disabled:cursor-not-allowed
                min-h-[48px]
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-neutral-light-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </div>
        </form>
      </div>
      <p className="mt-8 text-center text-sm text-neutral-light-text text-opacity-70">
        Not an admin?{' '}
        {/* Consider using RouterLink for internal navigation if appropriate */}
        <a href="/" className="font-medium text-accent-teal hover:text-accent-teal-dark underline">
          Go to Homepage
        </a>
      </p>
    </div>
  );
};

export default AdminLoginPage;