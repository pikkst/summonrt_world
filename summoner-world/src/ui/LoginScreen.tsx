import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import axios from 'axios';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const login = useGameStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      try {
        await axios.post('http://localhost:5000/api/register', { username, password });
        alert('Registered successfully! Now login.');
        setIsRegister(false);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Registration failed');
      }
    } else {
      const success = await login(username, password);
      if (!success) {
        alert('Login failed: Invalid username or password');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center text-white font-sans p-4 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-gray-900/40 backdrop-blur-2xl p-10 rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black tracking-[0.3em] text-emerald-400 uppercase mb-4">
              Soul Protocol v1.0
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-white mb-2 leading-none">
              SUMMONER<span className="text-emerald-500">WORLD</span>
            </h1>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest italic opacity-50">A Persistent Multi-World Simulation</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 ml-1">Identity Tag</label>
              <input 
                type="text" 
                placeholder="USERNAME"
                className="w-full bg-black/50 border border-gray-800 p-4 rounded-2xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all text-emerald-400 font-mono placeholder:text-gray-700"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 ml-1">Secure Key</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-black/50 border border-gray-800 p-4 rounded-2xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all text-emerald-400 font-mono placeholder:text-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
            >
              {isRegister ? 'ESTABLISH LINK' : 'AUTHORIZE SESSION'}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-gray-800 pt-8">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-[10px] text-gray-500 hover:text-emerald-400 transition-colors uppercase font-black tracking-widest"
            >
              {isRegister ? '← Return to Portal' : 'New Identity? Create Profile'}
            </button>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-8 opacity-20 grayscale hover:grayscale-0 transition-all">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stable Node</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Encrypted</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Persistent</span>
        </div>
      </div>
    </div>
  );
};
