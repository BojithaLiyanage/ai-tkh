import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Extract full name from email (before @) as a simple default
      const fullName = email.split('@')[0];
      await signup(email, password, fullName, 'client'); // Only client users can sign up
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-gray-50">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Register</h1>
          <p className="text-sm text-gray-500 leading-relaxed">Create an account to get started.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-5">
            <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm bg-white transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 hover:border-gray-400"
            />
          </div>
          
          <div className="mb-5">
            <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 hover:border-gray-400"
            />
          </div>
          
          <div className="mb-5">
            <label htmlFor="confirmPassword" className="block mb-1.5 text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 hover:border-gray-400"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-3 rounded-md mb-5 text-sm text-center">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-3 py-3 bg-gray-800 text-white border-none rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-gray-800/10"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="text-center border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-blue-600 no-underline font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;