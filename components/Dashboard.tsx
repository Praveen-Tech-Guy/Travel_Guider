
import React, { useState, useEffect } from 'react';
import { MessageSquare, Mic, Image as ImageIcon, Menu, X, Plane, MessageSquarePlus, Send, LogOut, User as UserIcon } from 'lucide-react';
import ChatInterface from './ChatInterface';
import VoiceMode from './VoiceMode';
import MediaStudio from './MediaStudio';
import { View, User } from '../types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<View>(View.PLANNER);
  // Default sidebar state: closed on mobile, open on desktop
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  
  // Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Handle window resize to auto-adjust sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: View.PLANNER, label: 'Trip Planner', icon: MessageSquare },
    { id: View.VOICE, label: 'Voice Assistant', icon: Mic },
    { id: View.STUDIO, label: 'Photo & Art Studio', icon: ImageIcon },
  ];

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    setIsSendingFeedback(true);
    
    // Simulate network request
    setTimeout(() => {
        setIsSendingFeedback(false);
        setFeedbackSent(true);
        setTimeout(() => {
            setFeedbackSent(false);
            setFeedbackText('');
            setShowFeedback(false);
        }, 2000);
    }, 1000);
  };

  const renderSidebarContent = () => (
    <>
      <div className="p-6 flex items-center space-x-3 border-b border-stone-800/50 bg-stone-900">
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-2 rounded-lg shadow-lg">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-serif font-bold text-white tracking-wide">WanderAI</h1>
          <button 
            className="md:hidden ml-auto text-stone-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
      </div>

      <div className="p-4">
             <div className="bg-stone-950/50 rounded-xl p-3 flex items-center space-x-3 border border-stone-800">
                <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-teal-500/20 flex-shrink-0">
                    {user.avatar ? (
                        <img src={user.avatar} alt="User" className="w-full h-full rounded-full" />
                    ) : (
                        <UserIcon className="w-5 h-5 text-teal-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                </div>
             </div>
      </div>

      <nav className="flex-1 py-2 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                    setCurrentView(item.id);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentView === item.id 
                  ? 'bg-teal-900/20 text-teal-400 border border-teal-500/20 shadow-sm' 
                  : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
      </nav>

      <div className="p-4 border-t border-stone-800/50 space-y-4">
          <div className="bg-amber-900/10 rounded-xl p-4 border border-amber-900/20 relative overflow-hidden group">
            <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2 relative z-10 flex items-center">
                <ImageIcon className="w-3 h-3 mr-1" /> Pro Tip
            </h4>
            <p className="text-xs text-stone-400 relative z-10 leading-relaxed">
              Use the Studio to visualize your destination with AI generated art before you even book!
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button 
                onClick={() => setShowFeedback(true)}
                className="w-full flex items-center space-x-2 text-stone-500 hover:text-teal-400 transition-colors text-xs font-medium px-2 py-2"
            >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Send Feedback</span>
            </button>
            <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-2 text-stone-500 hover:text-red-400 transition-colors text-xs font-medium px-2 py-2"
            >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
            </button>
          </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-stone-950 text-stone-200 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
      )}

      {/* Sidebar - Fixed on Mobile, Relative on Desktop */}
      <aside 
        className={`
            fixed md:relative z-50 inset-y-0 left-0 
            bg-stone-900 border-r border-stone-800 
            transition-transform duration-300 ease-in-out shadow-2xl
            flex flex-col w-64
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden md:border-0'}
        `}
      >
        {renderSidebarContent()}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
             <img 
                src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2000&auto=format&fit=crop" 
                alt="Travel Background" 
                className="w-full h-full object-cover opacity-10 filter blur-[2px]"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-950/95 to-stone-900/90"></div>
        </div>

        {/* Header */}
        <header className="h-16 bg-stone-950/80 backdrop-blur-md border-b border-stone-800/50 flex items-center justify-between px-4 md:px-6 z-10 sticky top-0 flex-shrink-0">
          <div className="flex items-center">
            <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="text-stone-400 hover:text-white transition-colors mr-4 p-1"
            >
                <Menu className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
             {/* User Avatar in Header */}
             <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                    <img src={user.avatar} alt="User" className="w-full h-full" />
                ) : (
                    <span className="text-xs font-bold text-teal-400">{user.name.charAt(0)}</span>
                )}
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-3 md:p-6 overflow-hidden relative z-10">
            <div className="h-full w-full max-w-7xl mx-auto">
                {currentView === View.PLANNER && <ChatInterface user={user} />}
                {currentView === View.VOICE && <VoiceMode />}
                {currentView === View.STUDIO && <MediaStudio user={user} />}
            </div>
        </div>
      </main>

      {/* Feedback Modal */}
      {showFeedback && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                  <button 
                    onClick={() => setShowFeedback(false)}
                    className="absolute top-4 right-4 text-stone-400 hover:text-white"
                  >
                      <X className="w-5 h-5" />
                  </button>
                  
                  <h3 className="text-xl font-serif font-bold text-white mb-2 flex items-center">
                      <MessageSquarePlus className="w-5 h-5 mr-2 text-teal-400" />
                      We value your input
                  </h3>
                  <p className="text-stone-400 text-xs mb-4">Help us improve WanderAI by sharing your thoughts.</p>

                  {feedbackSent ? (
                      <div className="py-8 text-center animate-in zoom-in">
                          <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Send className="w-6 h-6 text-teal-400" />
                          </div>
                          <p className="text-teal-400 font-medium">Feedback Sent!</p>
                          <p className="text-stone-500 text-xs mt-1">Thank you for helping us grow.</p>
                      </div>
                  ) : (
                      <>
                        <textarea 
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Tell us what you like or what we can improve..."
                            className="w-full bg-stone-950/50 border border-stone-700 rounded-xl p-3 text-white placeholder-stone-600 focus:ring-2 focus:ring-teal-500/50 transition-all resize-none text-sm mb-4"
                            rows={4}
                            disabled={isSendingFeedback}
                        />
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowFeedback(false)}
                                className="px-4 py-2 text-stone-400 hover:text-white text-xs font-medium transition-colors"
                                disabled={isSendingFeedback}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSendFeedback}
                                disabled={!feedbackText.trim() || isSendingFeedback}
                                className={`px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all ${(!feedbackText.trim() || isSendingFeedback) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-teal-900/20'}`}
                            >
                                {isSendingFeedback ? 'Sending...' : 'Send Feedback'}
                            </button>
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
