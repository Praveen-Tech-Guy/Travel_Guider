
import React from 'react';
import { Map, Camera, Mic, ArrowRight, Compass, Plane, BookOpen, Globe2, Palette } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-teal-500 selection:text-white relative overflow-x-hidden flex flex-col">
      
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>

      {/* Hero Section with Scrapbook Banner */}
      <div className="relative z-10 w-full bg-gradient-to-b from-stone-900 to-stone-950 pt-24 pb-20 md:pt-20 md:pb-32 overflow-hidden">
          
          {/* Collage Background Elements - Simulated "Banner" */}
          <div className="absolute top-0 left-0 w-full h-full z-0 opacity-40 md:opacity-100 pointer-events-none">
             
             {/* Left Photo - Beach (Visible on Mobile but scaled) */}
             <div className="absolute top-10 -left-16 md:left-[5%] w-40 md:w-64 h-52 md:h-80 bg-white p-2 md:p-3 shadow-2xl transform -rotate-6 animate-float" style={{animationDelay: '0s'}}>
                <div className="w-full h-full overflow-hidden bg-stone-200">
                    <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" alt="Beach" className="w-full h-full object-cover sepia-[.2]" />
                </div>
                <div className="text-stone-800 text-center font-hand text-lg md:text-xl mt-2 rotate-0">Paradise Found</div>
             </div>

             {/* Right Photo - City (Visible on Mobile but scaled) */}
             <div className="absolute top-20 -right-16 md:right-[5%] w-40 md:w-64 h-52 md:h-80 bg-white p-2 md:p-3 shadow-2xl transform rotate-6 animate-float" style={{animationDelay: '1s'}}>
                <div className="w-full h-full overflow-hidden bg-stone-200">
                    <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80" alt="Switzerland" className="w-full h-full object-cover sepia-[.2]" />
                </div>
                 <div className="text-stone-800 text-center font-hand text-lg md:text-xl mt-2 rotate-0">Alpine Dreams</div>
             </div>

             {/* Bottom Left - Culture (Hidden on Mobile) */}
             <div className="absolute bottom-[-10%] left-[15%] w-40 md:w-56 h-52 md:h-72 bg-white p-3 shadow-2xl transform rotate-3 hidden md:block animate-float" style={{animationDelay: '2s'}}>
                <div className="w-full h-full overflow-hidden bg-stone-200">
                     <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80" alt="Market" className="w-full h-full object-cover sepia-[.2]" />
                </div>
             </div>

              {/* Bottom Right - Desert (Hidden on Mobile) */}
             <div className="absolute bottom-[-5%] right-[20%] w-44 md:w-60 h-56 md:h-76 bg-white p-3 shadow-2xl transform -rotate-3 hidden md:block animate-float" style={{animationDelay: '1.5s'}}>
                <div className="w-full h-full overflow-hidden bg-stone-200">
                     <img src="https://images.unsplash.com/photo-1539650116455-8ef3bb6e368c?auto=format&fit=crop&w=800&q=80" alt="Desert" className="w-full h-full object-cover sepia-[.2]" />
                </div>
             </div>
             
             {/* Decorative Compass (Hidden on Mobile) */}
             <div className="absolute top-20 right-[25%] opacity-80 animate-spin-slow hidden lg:block">
                 <Compass className="w-24 h-24 text-amber-500/80 drop-shadow-lg" />
             </div>

              {/* Decorative Passport (Hidden on Mobile) */}
             <div className="absolute bottom-10 left-[10%] transform -rotate-12 hidden lg:block">
                 <div className="w-32 h-40 bg-amber-900 rounded-lg shadow-xl flex items-center justify-center border-2 border-amber-700/50">
                    <div className="w-24 h-24 border border-amber-800/50 rounded-full flex items-center justify-center">
                        <Globe2 className="w-16 h-16 text-amber-500/50" />
                    </div>
                    <span className="absolute bottom-2 text-[10px] text-amber-500/50 font-serif tracking-widest">PASSPORT</span>
                 </div>
             </div>
          </div>

          {/* Central Content */}
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center mt-8 md:mt-10">
            
            {/* Logo/Badge */}
            <div className="inline-flex items-center space-x-2 bg-stone-900/90 border border-amber-500/30 rounded-full px-4 py-1.5 md:px-5 md:py-2 mb-6 md:mb-8 backdrop-blur-md shadow-xl ring-1 ring-white/10 animate-fade-in-up">
                <Plane className="w-3 h-3 md:w-4 md:h-4 text-teal-400" />
                <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-amber-100">WanderAI Travel Companion</span>
            </div>

            {/* Handwritten Header */}
            <h2 className="font-hand text-4xl md:text-7xl text-amber-400 mb-2 transform -rotate-2 drop-shadow-md">
                Global Adventures & Planning
            </h2>

            {/* Main Title */}
            <h1 className="text-5xl md:text-8xl font-serif font-bold mb-6 md:mb-8 leading-none tracking-tight text-white drop-shadow-2xl">
              Explore Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-amber-200">World</span>
            </h1>

            <p className="text-base md:text-xl text-stone-300 max-w-xl md:max-w-2xl mb-8 md:mb-12 leading-relaxed font-light drop-shadow-md bg-stone-900/60 p-4 rounded-xl backdrop-blur-sm border border-stone-800">
              Your elite AI travel companion. Create detailed itineraries, visualize destinations with AI art, and converse in real-time.
            </p>

            {/* Action Button - Leather Style */}
            <button 
              onClick={onStart}
              className="group relative inline-flex items-center justify-center px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl font-hand font-bold text-white transition-all duration-200 bg-amber-800 rounded-lg hover:bg-amber-700 hover:scale-105 shadow-2xl shadow-amber-900/50 border-2 border-amber-700/50"
            >
              <span className="relative z-10 flex items-center">
                 Book Now
                 <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Stitching effect */}
              <div className="absolute inset-1 border border-dashed border-amber-600/50 rounded pointer-events-none"></div>
            </button>
          </div>
      </div>

      {/* Navbar (Absolute Top) */}
      <nav className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50">
        <div className="flex items-center space-x-2 bg-stone-900/80 p-2 rounded-lg backdrop-blur-sm border border-white/10">
            <div className="bg-teal-600 p-1.5 rounded-md">
                <Plane className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="text-lg md:text-xl font-serif font-bold text-white">WanderAI</span>
        </div>
        <button 
            onClick={onStart}
            className="text-xs md:text-sm font-bold text-stone-200 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-md bg-stone-900/50"
        >
            Sign In
        </button>
      </nav>

      {/* Features Grid */}
      <div className="flex-1 bg-stone-950 relative z-10 border-t border-stone-900">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <FeatureCard 
                    icon={Map}
                    title="Smart Itineraries"
                    desc="Data-driven travel plans tailored to your budget with real-time flight and hotel insights."
                    color="text-teal-400"
                />
                <FeatureCard 
                    icon={Mic}
                    title="Live Voice Guide"
                    desc="Chat hands-free with your AI assistant to navigate cities or translate languages instantly."
                    color="text-amber-400"
                />
                <FeatureCard 
                    icon={Palette}
                    title="AI Art Studio"
                    desc="Visualize your destination with stunning AI-generated imagery and advanced editing tools."
                    color="text-teal-400"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) => (
    <div className="bg-stone-900/50 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-stone-800 hover:border-amber-500/30 transition-all group hover:bg-stone-900 shadow-lg">
        <div className={`w-12 h-12 bg-stone-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-stone-800 transition-colors border border-stone-700 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold mb-3 font-serif text-stone-100">{title}</h3>
        <p className="text-stone-400 leading-relaxed text-sm">{desc}</p>
    </div>
);

export default Landing;
