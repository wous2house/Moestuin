import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { pb } from '../lib/pb';

export default function Login() {
  const { setCurrentUser } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Authenticate with PocketBase users collection
      const authData = await pb.collection('users').authWithPassword(username, password);
      
      // Update global store with the authenticated user
      setCurrentUser(authData.record.id);
    } catch (err: any) {
      console.error(err);
      setError('Inloggen mislukt. Controleer je gebruikersnaam en wachtwoord.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAF2EA] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 flex flex-col items-center">
        <img src="/logo-transparent.png" alt="Moestuin Logo" className="w-32 h-32 object-contain mb-6 drop-shadow-sm" />
        <h1 className="text-3xl font-bold text-[#1A2E1A] mb-2 font-serif text-center">Moestuin JTHV</h1>
        <p className="text-stone-500 mb-8 text-center">Log in op je account</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1 ml-1">Gebruikersnaam</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Je naam"
              className="w-full bg-[#F5F7F4] border-none rounded-xl p-4 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1 ml-1">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Je wachtwoord"
              className="w-full bg-[#F5F7F4] border-none rounded-xl p-4 text-sm font-bold text-[#1A2E1A] focus:ring-2 focus:ring-[#5A8F5A] focus:outline-none"
            />
            {error && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full py-4 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
          </button>
        </form>
        
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-300 mt-10">
          Versie {(window as any).__APP_VERSION__ || '1.3.81'}
        </p>
      </div>
    </div>
  );
}
