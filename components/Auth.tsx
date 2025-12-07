
import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Plane, AlertCircle, Users, Globe, Database } from 'lucide-react';
import { authService } from '../services/auth';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onClose: () => void;
}

const COUNTRIES = [
  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia", 
  "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "Hong Kong", "India", "Indonesia", 
  "Ireland", "Israel", "Italy", "Japan", "Malaysia", "Mexico", "Netherlands", "New Zealand", 
  "Norway", "Peru", "Philippines", "Poland", "Portugal", "Russia", "Saudi Arabia", "Singapore", 
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", 
  "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
];

const Auth: React.FC<AuthProps> = ({ onLogin, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'other' as 'male' | 'female' | 'other',
    country: 'United States'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let user: User;
      if (activeTab === 'login') {
        user = await authService.login(formData.email, formData.password);
      } else {
        if (!formData.name) throw new Error('Name is required');
        user = await authService.register(formData.name, formData.email, formData.password, formData.gender, formData.country);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (tab: 'login' | 'register') => {
      setActiveTab(tab);
      setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Auth Card */}
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header Visual */}
        <div className="h-32 bg-gradient-to-br from-teal-700 to-stone-800 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-900 to-transparent"></div>
          <div className="absolute bottom-6 left-6 flex items-center space-x-3">
             <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <Plane className="w-6 h-6 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-serif font-bold text-white">WanderAI</h2>
                <p className="text-xs text-teal-200 font-medium">Your Intelligent Travel Companion</p>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/50">
            <button
                onClick={() => switchTab('login')}
                className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${
                    activeTab === 'login' 
                    ? 'text-teal-400 border-b-2 border-teal-500 bg-stone-900' 
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'
                }`}
            >
                Sign In
            </button>
            <button
                onClick={() => switchTab('register')}
                className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${
                    activeTab === 'register' 
                    ? 'text-teal-400 border-b-2 border-teal-500 bg-stone-900' 
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'
                }`}
            >
                Create Account
            </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'register' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-5 h-5 text-stone-500" />
                    <input
                      type="text"
                      required
                      className="w-full bg-stone-950/50 border border-stone-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all outline-none"
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Gender</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-3 w-5 h-5 text-stone-500" />
                        <select
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value as any})}
                        className="w-full bg-stone-950/50 border border-stone-700 rounded-xl py-2.5 pl-10 pr-2 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all outline-none appearance-none text-sm"
                        >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        </select>
                    </div>
                    </div>

                    <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Country</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3 w-5 h-5 text-stone-500" />
                        <select
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                        className="w-full bg-stone-950/50 border border-stone-700 rounded-xl py-2.5 pl-10 pr-2 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all outline-none appearance-none text-sm"
                        >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-stone-500" />
                <input
                  type="email"
                  required
                  className="w-full bg-stone-950/50 border border-stone-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all outline-none"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-500" />
                <input
                  type="password"
                  required
                  className="w-full bg-stone-950/50 border border-stone-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-900/40 flex items-center justify-center space-x-2 mt-6 transform active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{activeTab === 'login' ? 'Access Dashboard' : 'Start Journey'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Local Storage Disclaimer */}
          <div className="mt-6 flex items-start space-x-2 p-3 bg-stone-950 rounded-lg border border-stone-800">
             <Database className="w-4 h-4 text-stone-500 mt-0.5 flex-shrink-0" />
             <p className="text-[10px] text-stone-500 leading-tight">
                <strong>Privacy Note:</strong> Your chat history and profile are encrypted and stored locally on this device. Logging in on a different device will not restore previous chats.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
