import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authType, setAuthType] = useState('sign-in');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    let result;
    if (authType === 'sign-in') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }
    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(authType === 'sign-in' ? 'Signed in!' : 'Check your email to confirm sign up.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Zephyr Auth</h1>
      <form onSubmit={handleAuth} className="bg-gray-800 p-6 rounded shadow-md w-full max-w-sm">
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            className="w-full p-2 rounded bg-gray-700 text-white"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input
            className="w-full p-2 rounded bg-gray-700 text-white"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex mb-4">
          <button
            type="button"
            className={`flex-1 p-2 rounded-l ${authType === 'sign-in' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setAuthType('sign-in')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 p-2 rounded-r ${authType === 'sign-up' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setAuthType('sign-up')}
          >
            Sign Up
          </button>
        </div>
        <button type="submit" className="w-full bg-green-600 p-2 rounded font-bold">
          {authType === 'sign-in' ? 'Sign In' : 'Sign Up'}
        </button>
        {error && <div className="text-red-400 mt-2">{error}</div>}
        {message && <div className="text-green-400 mt-2">{message}</div>}
      </form>
    </div>
  );
}
