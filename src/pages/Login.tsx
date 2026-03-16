import { useStore } from '../store/useStore';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { users, setCurrentUser } = useStore();

  return (
    <div className="min-h-screen bg-[#EAF2EA] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 flex flex-col items-center">
        <img src="/logo-transparent.png" alt="Moestuin Logo" className="w-32 h-32 object-contain mb-6 drop-shadow-sm" />
        <h1 className="text-3xl font-bold text-[#1A2E1A] mb-2 font-serif text-center">Moestuin JTHV</h1>
        <p className="text-stone-500 mb-8 text-center">Kies je profiel om in te loggen</p>

        <div className="w-full space-y-3">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setCurrentUser(user.id)}
              className="w-full flex items-center p-4 bg-[#F5F7F4] hover:bg-[#E8F0E8] border border-stone-200 hover:border-[#5A8F5A]/30 rounded-2xl transition-all group"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-[#5A8F5A]" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#E8F0E8] flex items-center justify-center text-xl font-bold text-[#5A8F5A] border-2 border-white shadow-sm group-hover:border-[#5A8F5A] group-hover:bg-[#5A8F5A] group-hover:text-white transition-colors">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="ml-4 text-left flex-1">
                <p className="text-lg font-bold text-[#1A2E1A]">{user.name}</p>
              </div>
              <LogIn className="w-5 h-5 text-stone-400 group-hover:text-[#5A8F5A]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
