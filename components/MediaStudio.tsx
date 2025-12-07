

import React, { useState, useEffect } from 'react';
import { Wand2, Image as ImageIcon, Download, Play, Sparkles, Trash2, Palette, Settings2, X, Maximize2, Loader2, Video, Film } from 'lucide-react';
import { editImage, generateImage, generateVeoVideo } from '../services/gemini';
import { GalleryItem, User, ImageModel, ImageAspectRatio, ImageResolution } from '../types';
import { loadGallery, saveGallery } from '../services/storage';

interface MediaStudioProps {
  user: User;
}

const MediaStudio: React.FC<MediaStudioProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'video'>('generate');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const saved = loadGallery(user.id);
    setGallery(saved);
    setIsLoaded(true);
  }, [user.id]);

  // Persist gallery whenever it changes, but only after initial load
  useEffect(() => {
    if (isLoaded) {
        saveGallery(user.id, gallery);
    }
  }, [gallery, user.id, isLoaded]);

  const addToGallery = (item: GalleryItem) => {
      setGallery(prev => [item, ...prev]);
  };

  const removeFromGallery = (id: string) => {
      setGallery(prev => prev.filter(i => i.id !== id));
      if (viewingItem?.id === id) setViewingItem(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/50 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 min-w-[140px] p-4 md:p-5 text-xs md:text-sm font-medium flex items-center justify-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'generate' 
            ? 'bg-slate-800/50 text-emerald-400 border-b-2 border-emerald-500' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Destination Visualizer</span>
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 min-w-[140px] p-4 md:p-5 text-xs md:text-sm font-medium flex items-center justify-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'video' 
            ? 'bg-slate-800/50 text-purple-400 border-b-2 border-purple-500' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Memories Animator (Veo)</span>
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 min-w-[140px] p-4 md:p-5 text-xs md:text-sm font-medium flex items-center justify-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'edit' 
            ? 'bg-slate-800/50 text-emerald-400 border-b-2 border-emerald-500' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Magic Editor</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Main Work Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {activeTab === 'generate' && <ImageGeneratorTool onComplete={addToGallery} />}
            {activeTab === 'video' && <VideoGeneratorTool onComplete={addToGallery} />}
            {activeTab === 'edit' && <ImageEditorTool onComplete={addToGallery} />}
        </div>

        {/* Gallery Strip */}
        <div className="bg-slate-950/80 border-t border-slate-800 p-4 h-48 flex-shrink-0">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                Recent Creations
            </h4>
            {gallery.length === 0 ? (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600 text-sm">
                    Your generated masterpieces will appear here
                </div>
            ) : (
                <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                    {gallery.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => setViewingItem(item)}
                            className="relative group min-w-[140px] w-[140px] h-28 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0 cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/50"
                        >
                            {item.type === 'image' ? (
                                <img src={item.url} alt="Gallery Item" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <video src={item.url} className="w-full h-full object-cover opacity-80" />
                            )}
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end space-x-1">
                                    <div className="text-white p-1 bg-black/20 rounded-full">
                                        <Maximize2 className="w-3 h-3" />
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeFromGallery(item.id); }}
                                        className="text-white hover:text-red-400 p-1 bg-black/20 rounded-full"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="text-[10px] text-white truncate px-1">
                                    {item.prompt}
                                </div>
                            </div>
                            
                            {/* Type Badge */}
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded text-[9px] text-white font-medium uppercase">
                                {item.type}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Media Viewer Modal */}
      {viewingItem && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setViewingItem(null)}
        >
            <div 
                className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={() => setViewingItem(null)}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors p-2"
                >
                    <X className="w-8 h-8" />
                </button>
                
                <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl w-full flex flex-col">
                    {/* Media Display */}
                    <div className="flex-1 bg-black/50 flex items-center justify-center p-4 min-h-[40vh] md:min-h-[60vh] relative">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50"></div>
                         {viewingItem.type === 'image' ? (
                            <img src={viewingItem.url} alt={viewingItem.prompt} className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl relative z-10" />
                         ) : (
                            <video src={viewingItem.url} controls autoPlay className="max-w-full max-h-[65vh] rounded-lg shadow-2xl relative z-10" />
                         )}
                    </div>
                    
                    {/* Details & Actions */}
                    <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    viewingItem.type === 'video' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                    {viewingItem.type === 'video' ? 'Veo Video' : 'Generated Image'}
                                </span>
                                <span className="text-slate-500 text-xs">
                                    {new Date(viewingItem.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-white text-sm md:text-base font-medium leading-relaxed">
                                {viewingItem.prompt}
                            </p>
                        </div>
                        
                        <a 
                            href={viewingItem.url} 
                            download={`wanderai-${viewingItem.type}-${viewingItem.id}.${viewingItem.type === 'image' ? 'png' : 'mp4'}`}
                            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap"
                        >
                            <Download className="w-5 h-5" />
                            <span>Download {viewingItem.type === 'video' ? 'Video' : 'Image'}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

interface ToolProps {
    onComplete: (item: GalleryItem) => void;
}

const ImageGeneratorTool: React.FC<ToolProps> = ({ onComplete }) => {
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings
  const [model, setModel] = useState<ImageModel>('gemini-2.5-flash-image');
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('1:1');
  const [resolution, setResolution] = useState<ImageResolution>('1K');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const result = await generateImage(prompt, model, aspectRatio, resolution);
      setResultImage(result);
      
      // Save to gallery
      onComplete({
          id: Date.now().toString(),
          type: 'image',
          url: result,
          prompt: prompt,
          timestamp: new Date()
      });

    } catch (e: any) {
      console.error(e);
      // Handle specific permission errors
      if (e.message?.includes('403') || e.message?.includes('PERMISSION_DENIED')) {
          alert(`Permission Denied: Your API key does not have access to the "${model === 'gemini-3-pro-image-preview' ? 'Pro' : 'Selected'}" model. Please try the Standard (Flash) model.`);
      } else {
          alert("Failed to generate image. " + (e.message || "Please check your connection or quota."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left: Controls */}
        <div className="space-y-6">
            <div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-2">Visualize Your Destination</h3>
                <p className="text-slate-400 text-sm">Enter a prompt describing your dream destination, and Gemini will generate a stunning image for you.</p>
            </div>

            <div className="space-y-4">
                {/* Prompt */}
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Destination Description</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="E.g., 'Golden sunset over the Santorini caldera with white buildings', 'Northern lights over a glass igloo in Finland'"
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none text-sm"
                        rows={4}
                    />
                </div>

                {/* Advanced Settings Toggle */}
                <div>
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center space-x-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>Advanced Settings {showSettings ? '(Hide)' : '(Show)'}</span>
                    </button>
                    
                    {showSettings && (
                        <div className="mt-3 p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4 animate-in slide-in-from-top-2">
                             {/* Model Select */}
                             <div>
                                <label className="text-xs text-slate-500 mb-1 block">AI Model</label>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => setModel('gemini-2.5-flash-image')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${model === 'gemini-2.5-flash-image' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                                    >
                                        Standard (Flash)
                                    </button>
                                    <button 
                                        onClick={() => setModel('gemini-3-pro-image-preview')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${model === 'gemini-3-pro-image-preview' ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                                    >
                                        Pro (Gemini 3)
                                    </button>
                                </div>
                                {model === 'gemini-3-pro-image-preview' && (
                                    <p className="text-[10px] text-purple-400 mt-1 flex items-center">
                                        <Sparkles className="w-3 h-3 mr-1" /> Requires Paid API Key
                                    </p>
                                )}
                             </div>

                             {/* Aspect Ratio */}
                             <div>
                                <label className="text-xs text-slate-500 mb-1 block">Aspect Ratio</label>
                                <select 
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value as ImageAspectRatio)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '3:2', '21:9'].map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                             </div>

                             {/* Resolution (Pro Only) */}
                             {model === 'gemini-3-pro-image-preview' && (
                                 <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Resolution (Pro Only)</label>
                                    <div className="flex space-x-2">
                                        {['1K', '2K', '4K'].map(res => (
                                            <button 
                                                key={res}
                                                onClick={() => setResolution(res as ImageResolution)}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${resolution === res ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                                            >
                                                {res}
                                            </button>
                                        ))}
                                    </div>
                                 </div>
                             )}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={!prompt || loading}
                    className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all uppercase flex items-center justify-center space-x-2 ${
                        !prompt || loading
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : model === 'gemini-3-pro-image-preview'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-lg shadow-purple-900/50'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/50'
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Palette className="w-4 h-4" />}
                    <span>{loading ? 'Generating...' : `Generate with ${model === 'gemini-3-pro-image-preview' ? 'Pro' : 'Standard'}`}</span>
                </button>
            </div>
        </div>

        {/* Right: Result */}
        <div className="bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-center p-4 relative min-h-[300px] md:min-h-[400px]">
            <div className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Output Canvas</div>
            {resultImage ? (
                <div className="relative group w-full h-full flex items-center justify-center">
                    <img src={resultImage} alt="Generated Result" className="max-w-full max-h-[300px] md:max-h-[400px] rounded-lg shadow-2xl" />
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                         <a 
                            href={resultImage} 
                            download="wanderai-gen.png"
                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 rounded-full text-white hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg flex items-center space-x-2 font-medium text-xs"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Art</span>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="text-slate-700 flex flex-col items-center">
                    <Palette className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Your imagination awaits</p>
                </div>
            )}
        </div>
    </div>
  );
};

const VideoGeneratorTool: React.FC<ToolProps> = ({ onComplete }) => {
    const [prompt, setPrompt] = useState('');
    const [resultVideo, setResultVideo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const result = await generateVeoVideo(prompt, undefined, aspectRatio);
            setResultVideo(result);
            
            onComplete({
                id: Date.now().toString(),
                type: 'video',
                url: result,
                prompt: prompt,
                timestamp: new Date()
            });

        } catch (e: any) {
            console.error(e);
             if (e.message?.includes('403') || e.message?.includes('PERMISSION_DENIED')) {
                 alert("Permission Denied: Video generation (Veo) requires a paid API key. Please connect your key in the prompt.");
             } else {
                alert("Failed to generate video. " + (e.message || "Please check your connection or quota."));
             }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-2">Animate Your Memories</h3>
                    <p className="text-slate-400 text-sm">Create stunning cinematic videos from text prompts using Google Veo.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Video Description</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="E.g., 'A cinematic drone shot of a waterfall in Iceland, 4k, realistic'"
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none text-sm"
                            rows={4}
                        />
                    </div>
                    
                    <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg flex items-start space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-purple-200/80">
                            <strong>Note:</strong> Video generation requires a paid Google Cloud API key. You will be prompted to select one if not already connected.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Aspect Ratio</label>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setAspectRatio('16:9')}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${aspectRatio === '16:9' ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                            >
                                Landscape (16:9)
                            </button>
                            <button 
                                onClick={() => setAspectRatio('9:16')}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${aspectRatio === '9:16' ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                            >
                                Portrait (9:16)
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt || loading}
                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all uppercase flex items-center justify-center space-x-2 ${
                            !prompt || loading
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-lg shadow-purple-900/50'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Film className="w-4 h-4" />}
                        <span>{loading ? 'Generating Video...' : 'Generate with Veo'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-center p-4 relative min-h-[300px] md:min-h-[400px]">
                 <div className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Output Canvas</div>
                 {resultVideo ? (
                    <div className="relative group w-full h-full flex flex-col items-center justify-center">
                        <video src={resultVideo} controls autoPlay loop className="max-w-full max-h-[300px] md:max-h-[400px] rounded-lg shadow-2xl" />
                        <div className="mt-4 flex space-x-2">
                             <a 
                                href={resultVideo} 
                                download="wanderai-veo.mp4"
                                className="bg-gradient-to-r from-purple-600 to-indigo-500 px-6 py-2 rounded-full text-white hover:from-purple-500 hover:to-indigo-400 transition-all shadow-lg flex items-center space-x-2 font-medium text-xs"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download Video</span>
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-700 flex flex-col items-center">
                        <Video className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Cinematic moments await</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ImageEditorTool: React.FC<ToolProps> = ({ onComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const handleEdit = async () => {
    if (!selectedFile || !prompt) return;
    setLoading(true);
    try {
      const result = await editImage(selectedFile, prompt);
      setResultImage(result);
      
      // Save to gallery
      onComplete({
          id: Date.now().toString(),
          type: 'image',
          url: result,
          prompt: prompt,
          timestamp: new Date()
      });

    } catch (e) {
      console.error(e);
      alert("Failed to edit image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left: Controls */}
        <div className="space-y-6">
            <div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-2">Enhance Reality</h3>
                <p className="text-slate-400 text-sm">Upload a travel photo and use AI to remove objects, change weather, or add creative elements.</p>
            </div>

            <div className="space-y-4">
                 {/* Upload */}
                <div 
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        previewUrl ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-slate-700 hover:bg-slate-800/50 hover:border-slate-600'
                    } relative`}
                >
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {previewUrl ? (
                        <div className="relative h-48 w-full">
                             <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                <span className="text-white text-sm font-medium">Click to change</span>
                             </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 text-emerald-500">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                            <span className="text-slate-300 font-medium">Upload Photo</span>
                            <span className="text-slate-500 text-xs mt-1">JPG, PNG up to 5MB</span>
                        </div>
                    )}
                </div>

                {/* Prompt */}
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Magic Command</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="E.g., 'Remove the people in the background' or 'Change the sky to a sunset'"
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none text-sm"
                        rows={3}
                    />
                </div>

                <button
                    onClick={handleEdit}
                    disabled={!selectedFile || !prompt || loading}
                    className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all uppercase flex items-center justify-center space-x-2 ${
                        !selectedFile || !prompt || loading
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/50'
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                    <span>{loading ? 'Processing Magic...' : 'Generate Edit'}</span>
                </button>
            </div>
        </div>

        {/* Right: Result */}
        <div className="bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-center p-4 relative min-h-[300px] md:min-h-[400px]">
            <div className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Output Canvas</div>
            {resultImage ? (
                <div className="relative group w-full h-full flex items-center justify-center">
                    <img src={resultImage} alt="Edited Result" className="max-w-full max-h-[300px] md:max-h-[400px] rounded-lg shadow-2xl" />
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                         <a 
                            href={resultImage} 
                            download="wanderai-edit.png"
                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 rounded-full text-white hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg flex items-center space-x-2 font-medium text-xs"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Art</span>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="text-slate-700 flex flex-col items-center">
                    <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm font-medium">AI generated art will appear here</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default MediaStudio;
