
import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Loader2, DollarSign, ExternalLink, Globe, Plus, MessageSquare, Trash2, History, ShoppingBag, Zap, Brain, Sparkles, ChevronDown, Filter, Tag, Coins, Paperclip, X, Image as ImageIcon, Video } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChatMessage, ChatSession, ModelMode, User, TripType, Currency, Attachment } from '../types';
import { sendMessage, fileToGenerativePart } from '../services/gemini';
import { loadSessions, saveSessions } from '../services/storage';

interface ChatInterfaceProps {
    user: User;
}

const TRIP_TYPES: TripType[] = ['General', 'Adventure', 'Relaxation', 'Business', 'Family', 'Cultural'];
const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

const getDefaultCurrency = (country?: string): Currency => {
    if (!country) return 'USD';
    const map: Record<string, Currency> = {
        'United Kingdom': 'GBP',
        'Canada': 'CAD',
        'Australia': 'AUD', 'New Zealand': 'AUD',
        'India': 'INR',
        'Japan': 'JPY',
        'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR', 'Spain': 'EUR', 'Netherlands': 'EUR', 
        'Belgium': 'EUR', 'Austria': 'EUR', 'Ireland': 'EUR', 'Finland': 'EUR', 'Portugal': 'EUR', 'Greece': 'EUR',
        'Switzerland': 'EUR', 'Sweden': 'EUR'
    };
    return map[country] || 'USD';
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user }) => {
  // Session State - Initializing from storage for specific user
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Filter State
  const [filterType, setFilterType] = useState<TripType | 'All'>('All');
  const [showMobileHistory, setShowMobileHistory] = useState(false);

  // Initialize currency based on user country
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => getDefaultCurrency(user.country));
  
  // Attachments State
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = loadSessions(user.id);
    const defaultCurr = getDefaultCurrency(user.country);
    
    // Update currency if user country changes (e.g. fresh login data)
    setSelectedCurrency(defaultCurr);

    if (saved.length > 0) {
        setSessions(saved);
    } else {
        setSessions([{
            id: 'default',
            title: 'New Trip Plan',
            type: 'General',
            updatedAt: new Date(),
            messages: [{
                id: 'welcome',
                role: 'model',
                text: `Hello ${user.name.split(' ')[0]}! I'm WanderAI. I know you're from ${user.country || 'Earth'}. Where are you dreaming of going today? Pick a mode from the top right to customize how I think!`,
                timestamp: new Date(),
                currency: defaultCurr
            }]
        }]);
    }
    setIsLoaded(true);
  }, [user.id, user.name, user.country]);

  const [activeSessionId, setActiveSessionId] = useState<string>('');
  
  // Set active session once loaded
  useEffect(() => {
      if (isLoaded && !activeSessionId && sessions.length > 0) {
          setActiveSessionId(sessions[0].id);
      }
  }, [isLoaded, sessions, activeSessionId]);

  const [modelMode, setModelMode] = useState<ModelMode>('balanced');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeSession) {
        scrollToBottom();
    }
  }, [activeSession?.messages, isLoading, attachments]);

  // Persist sessions whenever they change
  useEffect(() => {
    if (isLoaded && sessions.length > 0) {
        saveSessions(user.id, sessions);
    }
  }, [sessions, user.id, isLoaded]);

  const handleCreateNewSession = () => {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
          id: newId,
          title: 'New Trip Plan',
          type: 'General',
          updatedAt: new Date(),
          messages: [{
            id: 'welcome',
            role: 'model',
            text: "Ready for a new adventure! Where to next?",
            timestamp: new Date(),
            currency: selectedCurrency
        }]
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      setFilterType('All'); // Reset filter to show new session
      if (window.innerWidth < 768) setShowMobileHistory(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (sessions.length === 1) return; // Don't delete last session
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      if (activeSessionId === id) {
          setActiveSessionId(newSessions[0].id);
      }
  };

  const handleUpdateSessionType = (type: TripType) => {
      if (!activeSession) return;
      setSessions(prev => prev.map(s => {
          if (s.id === activeSession.id) {
              return { ...s, type };
          }
          return s;
      }));
      setIsTypeDropdownOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newAttachments: Attachment[] = [];
          for (let i = 0; i < e.target.files.length; i++) {
              const file = e.target.files[i];
              try {
                  const base64 = await fileToGenerativePart(file);
                  newAttachments.push({
                      type: file.type.startsWith('image') ? 'image' : 'video',
                      mimeType: file.type,
                      data: base64,
                      name: file.name
                  });
              } catch (err) {
                  console.error("Error processing file", file.name, err);
              }
          }
          setAttachments(prev => [...prev, ...newAttachments]);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || !activeSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    // Clear inputs immediately
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    // Optimistic update
    setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
            const hasUserMessages = s.messages.some(m => m.role === 'user');
            
            let newTitle = s.title;
            if (!hasUserMessages) {
                // Generate title from input, truncated to 30 chars
                newTitle = input.trim();
                if (newTitle.length > 30) {
                    newTitle = newTitle.substring(0, 30) + '...';
                } else if (!newTitle && userMsg.attachments) {
                    newTitle = "Media Analysis";
                }
            }
            
            return {
                ...s,
                title: newTitle,
                updatedAt: new Date(),
                messages: [...s.messages, userMsg]
            };
        }
        return s;
    }));

    // Pass history (text only handled in service) + current message with attachments
    const currentHistory = [...activeSession.messages, userMsg];
    
    // Pass user's country and selected currency
    const response = await sendMessage(
        userMsg.text, 
        modelMode, 
        currentHistory, 
        user.country || 'United States', 
        selectedCurrency,
        userMsg.attachments
    );
    
    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      timestamp: new Date(),
      groundingLinks: response.groundingLinks,
      costData: response.costData,
      currency: selectedCurrency // Store currency snapshot
    };

    setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
            return {
                ...s,
                updatedAt: new Date(),
                messages: [...s.messages, modelMsg]
            };
        }
        return s;
    }));
    setIsLoading(false);
  };

  const getModelIcon = (mode: ModelMode) => {
      switch(mode) {
          case 'fast': return <Zap className="w-4 h-4 text-amber-400" />;
          case 'deep': return <Brain className="w-4 h-4 text-purple-400" />;
          default: return <Sparkles className="w-4 h-4 text-teal-400" />;
      }
  };

  const getModelLabel = (mode: ModelMode) => {
      switch(mode) {
          case 'fast': return 'Fast (Flash Lite)';
          case 'deep': return 'Thinking (Pro 3)';
          default: return 'Standard (Flash)';
      }
  };

  const getFilteredSessions = () => {
      if (filterType === 'All') return sessions;
      return sessions.filter(s => (s.type || 'General') === filterType);
  };

  const getTypeColor = (type?: TripType) => {
      switch(type) {
          case 'Adventure': return 'text-orange-400 bg-orange-900/20 border-orange-700/30';
          case 'Relaxation': return 'text-blue-400 bg-blue-900/20 border-blue-700/30';
          case 'Business': return 'text-slate-400 bg-slate-800 border-slate-700';
          case 'Cultural': return 'text-pink-400 bg-pink-900/20 border-pink-700/30';
          case 'Family': return 'text-green-400 bg-green-900/20 border-green-700/30';
          default: return 'text-stone-400 bg-stone-800 border-stone-700';
      }
  };

  if (!isLoaded || !activeSession) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" /></div>;

  return (
    <div className="flex h-full gap-6 relative">
        {/* Saved Chats Sidebar (Responsive) */}
        <div className={`
            absolute md:relative inset-y-0 left-0 z-30
            w-64 bg-stone-900/95 backdrop-blur-xl border-r md:border border-stone-800 
            md:rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out
            flex flex-col
            ${showMobileHistory ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <div className="p-4 border-b border-stone-800/50 space-y-4">
                <button 
                    onClick={handleCreateNewSession}
                    className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg transition-all shadow-lg shadow-teal-900/20 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span>Plan New Trip</span>
                </button>
                
                {/* Filter Dropdown */}
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-500" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="w-full bg-stone-950/50 border border-stone-800 rounded-lg py-2 pl-9 pr-3 text-xs text-stone-400 focus:outline-none focus:border-teal-500/50 appearance-none cursor-pointer hover:bg-stone-900"
                    >
                        <option value="All">All Trips</option>
                        {TRIP_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-3 h-3 text-stone-600 pointer-events-none" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {getFilteredSessions().length === 0 ? (
                    <div className="text-center py-8 text-stone-600 text-xs italic">
                        No {filterType !== 'All' ? filterType.toLowerCase() : ''} trips found.
                    </div>
                ) : (
                    getFilteredSessions().map(session => (
                        <div 
                            key={session.id}
                            onClick={() => {
                                setActiveSessionId(session.id);
                                if (window.innerWidth < 768) setShowMobileHistory(false);
                            }}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                                activeSessionId === session.id 
                                ? 'bg-stone-800 border-teal-500/30 text-teal-400' 
                                : 'hover:bg-stone-800/50 border-transparent text-stone-400'
                            }`}
                        >
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                <div className="flex flex-col truncate">
                                    <span className="text-sm font-medium truncate">{session.title}</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[10px] opacity-60">{session.updatedAt.toLocaleDateString()}</span>
                                        {session.type && session.type !== 'General' && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${getTypeColor(session.type).replace('text-', 'border-').split(' ')[2]}`}>
                                                {session.type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {sessions.length > 1 && (
                                 <button 
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                                 >
                                    <Trash2 className="w-3 h-3" />
                                 </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Mobile Overlay */}
        {showMobileHistory && (
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
                onClick={() => setShowMobileHistory(false)}
            ></div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-stone-900/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-stone-800 relative w-full">
            
            {/* Header */}
            <div className="bg-stone-950/80 p-4 border-b border-stone-800 flex flex-wrap gap-4 items-center justify-between z-10">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Mobile History Toggle */}
                    <button 
                        onClick={() => setShowMobileHistory(!showMobileHistory)}
                        className="md:hidden p-2 text-stone-400 hover:text-white"
                    >
                        <History className="w-5 h-5" />
                    </button>

                    <div className="bg-teal-500/10 p-2 rounded-lg hidden sm:block">
                        <Globe className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-lg font-serif font-semibold text-white tracking-wide truncate">
                                {activeSession.title}
                            </h2>
                            
                            {/* Trip Type Selector Badge */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                    className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all hover:opacity-80 ${getTypeColor(activeSession.type || 'General')}`}
                                >
                                    <span>{activeSession.type || 'General'}</span>
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>

                                {isTypeDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-32 bg-stone-900 border border-stone-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                        {TRIP_TYPES.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => handleUpdateSessionType(type)}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-stone-800 transition-colors ${
                                                    (activeSession.type || 'General') === type ? 'text-teal-400 font-bold bg-stone-800/50' : 'text-stone-400'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-xs text-stone-400 flex items-center mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
                            Online &bull; Origin: {user.country || 'Unknown'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {/* Currency Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                            className="flex items-center space-x-1 bg-stone-900 border border-stone-700 hover:border-teal-500/50 rounded-lg px-2 py-2 transition-all"
                            title="Select Currency"
                        >
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-stone-300">{selectedCurrency}</span>
                            <ChevronDown className="w-3 h-3 text-stone-500" />
                        </button>
                         {isCurrencyDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-24 bg-stone-900 border border-stone-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                {CURRENCIES.map(curr => (
                                    <button
                                        key={curr}
                                        onClick={() => { setSelectedCurrency(curr); setIsCurrencyDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-stone-800 ${selectedCurrency === curr ? 'text-teal-400 font-bold' : 'text-stone-400'}`}
                                    >
                                        {curr}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Model Selector */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                            className="flex items-center space-x-2 bg-stone-900 border border-stone-700 hover:border-teal-500/50 rounded-lg px-3 py-2 transition-all"
                        >
                            {getModelIcon(modelMode)}
                            <span className="text-xs font-medium text-stone-200 hidden sm:inline">{getModelLabel(modelMode)}</span>
                            <ChevronDown className="w-3 h-3 text-stone-500" />
                        </button>
                        
                        {isModelDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-stone-900 border border-stone-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1">
                                    <button onClick={() => { setModelMode('fast'); setIsModelDropdownOpen(false); }} className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium ${modelMode === 'fast' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'}`}>
                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Fast (Flash Lite)</span>
                                    </button>
                                    <button onClick={() => { setModelMode('balanced'); setIsModelDropdownOpen(false); }} className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium ${modelMode === 'balanced' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'}`}>
                                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                                        <span>Standard (Flash)</span>
                                    </button>
                                    <button onClick={() => { setModelMode('deep'); setIsModelDropdownOpen(false); }} className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium ${modelMode === 'deep' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'}`}>
                                        <Brain className="w-3.5 h-3.5 text-purple-400" />
                                        <span>Thinking (Pro 3)</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth">
                {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    
                    {/* Avatar for Model */}
                    {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                             <Globe className="w-4 h-4 text-teal-500" />
                        </div>
                    )}

                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-6 shadow-xl relative backdrop-blur-sm border ${
                        msg.role === 'user' 
                        ? 'bg-gradient-to-br from-teal-600 to-teal-800 text-white border-teal-500/30 rounded-tr-none' 
                        : 'bg-stone-800/80 text-stone-200 border-stone-700/50 rounded-tl-none'
                    }`}>
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {msg.attachments.map((att, i) => (
                                <div key={i} className="relative rounded-lg overflow-hidden border border-white/20">
                                    {att.type === 'image' ? (
                                        <img src={`data:${att.mimeType};base64,${att.data}`} alt="Attachment" className="h-32 w-auto object-cover" />
                                    ) : (
                                        <div className="h-32 w-32 bg-black flex items-center justify-center">
                                            <Video className="w-8 h-8 text-white/50" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Message Content */}
                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                        <ReactMarkdown 
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-xl font-serif font-bold text-teal-200 mb-2 mt-4" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-serif font-bold text-teal-300 mb-2 mt-3" {...props} />,
                                strong: ({node, ...props}) => <strong className="text-teal-100 font-semibold" {...props} />,
                                ul: ({node, ...props}) => <ul className="my-2 space-y-2" {...props} />,
                                li: ({node, ...props}) => <li className="marker:text-teal-500" {...props} />,
                                a: ({node, ...props}) => {
                                    const isShopping = props.href?.includes('amazon.com') || props.href?.includes('shop');
                                    return (
                                        <a 
                                            className={`inline-flex items-center gap-1 transition-all ${
                                                isShopping 
                                                ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 px-3 py-1.5 rounded-lg border border-amber-500/30 no-underline hover:from-amber-600 hover:to-amber-700 hover:text-white hover:border-amber-400 mx-1 font-medium text-xs transform hover:scale-105 shadow-md shadow-amber-900/20' 
                                                : 'text-teal-400 hover:text-teal-300 font-medium underline decoration-teal-500/50 underline-offset-4'
                                            }`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            {...props}
                                        >
                                            {isShopping && <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />}
                                            <span>{props.children}</span>
                                            {!isShopping && <ExternalLink className="w-3 h-3" />}
                                        </a>
                                    );
                                },
                            }}
                        >
                            {msg.text.replace(/```json[\s\S]*?```/, '')}
                        </ReactMarkdown>
                    </div>

                    {/* Cost Chart */}
                    {msg.costData && msg.costData.length > 0 && (
                        <div className="mt-6 bg-stone-900/60 p-5 rounded-xl border border-stone-700/50 shadow-inner">
                            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" /> Estimated Cost Breakdown ({msg.currency || 'USD'})
                            </h4>
                            <div className="h-48 w-full min-w-0" style={{ minHeight: '1px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={msg.costData}>
                                    <XAxis dataKey="category" stroke="#78716c" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#78716c" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', color: '#f5f5f4', borderRadius: '8px' }}
                                        itemStyle={{ color: '#2dd4bf' }}
                                        formatter={(value: number) => [`${value} ${msg.currency || 'USD'}`, 'Amount']}
                                    />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} animationDuration={1000}>
                                        {msg.costData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#14b8a6' : '#0d9488'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-800">
                                <span className="text-xs text-stone-500">Estimates only</span>
                                <span className="text-sm font-bold text-white">
                                    Total: <span className="text-teal-400">{msg.costData.reduce((acc, item) => acc + item.amount, 0).toLocaleString()} {msg.currency || 'USD'}</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Grounding Links */}
                    {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-white/10">
                        <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" /> Verified Sources
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {msg.groundingLinks.slice(0, 4).map((link, idx) => (
                            <a 
                                key={idx} 
                                href={link} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`flex items-center text-xs px-3 py-1.5 rounded-full transition-all border ${
                                    msg.role === 'user' 
                                    ? 'bg-teal-800/50 border-teal-400/30 text-teal-100 hover:bg-teal-700' 
                                    : 'bg-stone-900/50 border-stone-700 text-teal-400 hover:bg-stone-900'
                                }`}
                            >
                                <ExternalLink className="w-3 h-3 mr-1.5 opacity-70" />
                                <span className="truncate max-w-[150px]">{new URL(link).hostname.replace('www.', '')}</span>
                            </a>
                            ))}
                        </div>
                        </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className="mt-3 flex justify-end">
                        <span className={`text-[10px] font-medium tracking-wide ${msg.role === 'user' ? 'text-teal-200/60' : 'text-stone-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    </div>
                </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center mr-3">
                             <Globe className="w-4 h-4 text-teal-500" />
                        </div>
                        <div className="bg-stone-800/50 rounded-2xl p-4 flex items-center space-x-3 border border-stone-700/50">
                            {modelMode === 'deep' ? (
                                <div className="flex items-center space-x-2 text-purple-400 text-sm font-medium animate-pulse">
                                    <Brain className="w-4 h-4" />
                                    <span>Thinking deeply...</span>
                                </div>
                            ) : (
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-stone-950/80 backdrop-blur-md border-t border-stone-800">
                {/* File Previews */}
                {attachments.length > 0 && (
                    <div className="flex space-x-3 mb-3 overflow-x-auto pb-2">
                        {attachments.map((att, idx) => (
                            <div key={idx} className="relative group flex-shrink-0">
                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-teal-500/50 bg-stone-900">
                                    {att.type === 'image' ? (
                                        <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" alt="preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Video className="w-8 h-8 text-teal-400" />
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative flex items-center">
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute left-2 text-stone-400 hover:text-teal-400 p-2 transition-colors rounded-lg hover:bg-stone-800"
                        title="Attach images or videos for analysis"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={modelMode === 'deep' ? "Ask a complex question..." : "Describe your dream trip..."}
                        className={`w-full bg-stone-900/80 text-white placeholder-stone-500 border rounded-xl pl-12 pr-14 py-4 focus:outline-none transition-all shadow-inner ${
                            modelMode === 'deep' 
                            ? 'border-purple-500/30 focus:ring-2 focus:ring-purple-500/50' 
                            : 'border-stone-700 focus:ring-2 focus:ring-teal-500/50'
                        }`}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && attachments.length === 0)}
                        className={`absolute right-2 top-2 bottom-2 text-white p-2.5 rounded-lg transition-all shadow-lg ${
                            isLoading || (!input.trim() && attachments.length === 0)
                            ? 'bg-stone-700 opacity-50 cursor-not-allowed' 
                            : modelMode === 'deep'
                                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'
                                : 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/20'
                        } ${!isLoading && 'hover:scale-105 active:scale-95'}`}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChatInterface;
