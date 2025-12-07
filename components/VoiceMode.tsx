

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, XCircle } from 'lucide-react';
import { connectToLive, base64ToFloat32Array, createPcmBlob } from '../services/gemini';
import { LiveServerMessage } from '@google/genai';

const VoiceMode: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [volume, setVolume] = useState(0);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  // Track active state to avoid closure staleness
  const isConnectedRef = useRef(false);

  // Track active sources to handle interruption
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  // Track inputs to clean up
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const disconnect = () => {
    isConnectedRef.current = false;

    // Stop microphone stream
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }

    // Stop input processor
    if (inputProcessorRef.current) {
        inputProcessorRef.current.disconnect();
        inputProcessorRef.current = null;
    }
    
    // Close Input Context
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }

    // Stop all playing audio
    stopAllAudio();

    // Close AudioContext
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    setConnected(false);
    setStatus('disconnected');
    setVolume(0);
    sessionPromiseRef.current = null;
  };

  const stopAllAudio = () => {
      scheduledSourcesRef.current.forEach(node => {
          try {
              node.stop();
          } catch (e) {
              // Ignore errors if already stopped
          }
      });
      scheduledSourcesRef.current = [];
      nextStartTimeRef.current = 0; // Reset queue
  };

  const handleConnect = async () => {
    if (connected) {
      disconnect();
      return;
    }

    try {
      setStatus('connecting');
      isConnectedRef.current = true;
      
      // Setup Audio Contexts
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      
      // Output Context (24kHz)
      const outputContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = outputContext;
      nextStartTimeRef.current = 0;

      // Important: Resume context (browsers block autoplay until interaction)
      await outputContext.resume();

      // Input Context (16kHz for Gemini)
      const inputContext = new AudioContext({ sampleRate: 16000 });
      inputAudioContextRef.current = inputContext;

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Connect to Gemini Live
      sessionPromiseRef.current = connectToLive(
        async (msg: LiveServerMessage) => {
            if (!isConnectedRef.current) return;

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
                console.log("Interruption signal received. Stopping playback.");
                stopAllAudio();
                // Reset sync time to current time
                if (audioContextRef.current) {
                    nextStartTimeRef.current = audioContextRef.current.currentTime;
                }
                return;
            }

            // Handle incoming audio
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBuffer = await decodeAudioData(base64Audio, outputContext);
                playAudio(audioBuffer, outputContext);
            }
        },
        () => {
            if (!isConnectedRef.current) return;
            setStatus('connected');
            setConnected(true);
            
            // Start streaming input
            const source = inputContext.createMediaStreamSource(stream);
            const processor = inputContext.createScriptProcessor(4096, 1, 1);
            inputProcessorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
                // Use Ref to check connection state to avoid stale closure
                if (!isConnectedRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for visualization
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length) * 100);

                const pcmBlob = createPcmBlob(inputData);
                
                sessionPromiseRef.current?.then(session => {
                    if (isConnectedRef.current) {
                        session.sendRealtimeInput({ media: pcmBlob });
                    }
                });
            };
            
            source.connect(processor);
            processor.connect(inputContext.destination);
        },
        () => disconnect(),
        (e) => {
            console.error(e);
            setStatus('error');
            disconnect();
        }
      );

    } catch (err) {
      console.error("Voice connection failed", err);
      setStatus('error');
      isConnectedRef.current = false;
    }
  };

  const decodeAudioData = async (base64: string, ctx: AudioContext) => {
      const data = base64ToFloat32Array(base64);
      const buffer = ctx.createBuffer(1, data.length, 24000);
      buffer.copyToChannel(data, 0);
      return buffer;
  };

  const playAudio = (buffer: AudioBuffer, ctx: AudioContext) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      const currentTime = ctx.currentTime;
      // Ensure we schedule after the previous chunk, or immediately if we fell behind
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      
      source.onended = () => {
          // Remove from tracking list when done
          scheduledSourcesRef.current = scheduledSourcesRef.current.filter(n => n !== source);
      };

      scheduledSourcesRef.current.push(source);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden">
      {/* Background Pulse Effect */}
      {status === 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div 
             className="w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl transition-transform duration-100"
             style={{ transform: `scale(${1 + volume / 20})` }}
           />
        </div>
      )}

      <div className="z-10 flex flex-col items-center space-y-8">
        <h2 className="text-3xl font-serif text-white text-center">
            {status === 'connected' ? "Listening..." : "Talk to WanderAI"}
        </h2>
        
        <div className="relative group">
            <button
                onClick={handleConnect}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                    status === 'connected' 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
            >
                {status === 'connecting' ? (
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : status === 'connected' ? (
                    <Mic className="w-12 h-12 text-white" />
                ) : (
                    <MicOff className="w-12 h-12 text-white opacity-80" />
                )}
            </button>
        </div>

        <p className="text-slate-400 max-w-md text-center">
            {status === 'error' && <span className="text-red-400 font-medium">Connection failed. Please allow microphone access.</span>}
            {status === 'disconnected' && "Start a real-time voice conversation to plan your trip hands-free."}
            {status === 'connecting' && "Establishing secure connection to Gemini Live..."}
            {status === 'connected' && "Go ahead, interrupt me anytime. Ask about Paris, Tokyo, or anywhere else."}
        </p>

        {status === 'connected' && (
             <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-950/50 px-4 py-2 rounded-full border border-emerald-900/50">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">Live Session Active</span>
             </div>
        )}
      </div>
    </div>
  );
};

export default VoiceMode;
