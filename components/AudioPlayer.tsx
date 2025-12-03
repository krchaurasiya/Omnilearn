import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0); 
  const pausedAtRef = useRef<number>(0); 
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      stop();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const play = async () => {
    if (!audioContextRef.current) return;
    
    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Create source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    // Loop back if we are at the end
    if (pausedAtRef.current >= audioBuffer.duration) {
      pausedAtRef.current = 0;
    }

    const offset = pausedAtRef.current;
    source.start(0, offset);
    
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    sourceRef.current = source;
    
    setIsPlaying(true);
    
    // Start animation loop
    const tick = () => {
      if (!audioContextRef.current || !sourceRef.current) return;
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      
      if (elapsed >= audioBuffer.duration) {
        stop(); // Natural finish
      } else {
        setCurrentTime(elapsed);
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const pause = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
        pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current;
    }
    setIsPlaying(false);
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
  };

  const stop = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceRef.current = null;
    }
    pausedAtRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
  };

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    pausedAtRef.current = newTime;
    
    if (isPlaying) {
      if (sourceRef.current) {
          sourceRef.current.stop();
      }
      play(); 
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-md rounded-xl px-4 py-2 animate-in fade-in zoom-in-95 duration-200 w-full max-w-sm sm:max-w-md">
      <button 
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>
      
      <button 
        onClick={stop}
        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0 focus:outline-none"
        title="Stop"
        aria-label="Stop"
      >
        <Square size={16} fill="currentColor" />
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1 min-w-[100px]">
         <input
           type="range"
           min="0"
           max={audioBuffer.duration}
           step="0.01"
           value={currentTime}
           onChange={handleSeek}
           className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
             [&::-webkit-slider-thumb]:appearance-none 
             [&::-webkit-slider-thumb]:w-3 
             [&::-webkit-slider-thumb]:h-3 
             [&::-webkit-slider-thumb]:bg-indigo-600 
             [&::-webkit-slider-thumb]:rounded-full 
             [&::-webkit-slider-thumb]:border-2 
             [&::-webkit-slider-thumb]:border-white 
             [&::-webkit-slider-thumb]:shadow-sm
             hover:[&::-webkit-slider-thumb]:scale-125
             transition-all focus:outline-none"
         />
         <div className="flex justify-between text-[10px] text-slate-500 font-medium tabular-nums select-none">
           <span>{formatTime(currentTime)}</span>
           <span>{formatTime(audioBuffer.duration)}</span>
         </div>
      </div>
    </div>
  );
};

export default AudioPlayer;