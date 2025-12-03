import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Settings, 
  Play, 
  Search,
  Loader2,
  Check,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { generateLessonPlan, textToSpeech } from './services/geminiService';
import { DifficultyLevel, LessonContent, UserSettings } from './types';
import MarkdownRenderer from './components/MarkdownRenderer';
import Quiz from './components/Quiz';
import AudioPlayer from './components/AudioPlayer';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  // State
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [concept, setConcept] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.ELEMENTARY);
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'quiz' | 'chat'>('learn');
  
  // Audio State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState<UserSettings>({
    textSize: 'medium',
    highContrast: false
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Initialize
  useEffect(() => {
    const checkKey = async () => {
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        setApiKeyReady(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleApiKeySelection = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      // Assume success as per instructions
      setApiKeyReady(true);
    }
  };

  const isQuotaError = (error: any): boolean => {
    const msg = error?.message || '';
    const code = error?.status || error?.code;
    const errString = JSON.stringify(error);
    return code === 429 || msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED') || errString.includes('RESOURCE_EXHAUSTED');
  };

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setLoading(true);
    setLesson(null);
    setAudioBuffer(null);
    setActiveTab('learn');

    try {
      const data = await generateLessonPlan(concept, difficulty);
      setLesson(data);
    } catch (error: any) {
      console.error(error);
      if (isQuotaError(error)) {
        alert("Daily generation limit exceeded. Please check your plan or try again later.");
      } else {
        alert("Failed to generate lesson. Please check your API key and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async () => {
    if (!lesson?.detailedExplanation) return;
    if (audioBuffer) return; // Already loaded

    setLoadingAudio(true);
    try {
      const buffer = await textToSpeech(lesson.summary); // Read summary first for speed/demo
      setAudioBuffer(buffer);
    } catch (e: any) {
      console.error("TTS failed", e);
      if (isQuotaError(e)) {
        alert("Audio generation quota exceeded.");
      } else {
        alert("Failed to generate audio.");
      }
    } finally {
      setLoadingAudio(false);
    }
  };

  // Text size classes
  const getTextSizeClass = () => {
    switch (settings.textSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-indigo-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to OmniLearn</h1>
          <p className="text-slate-600 mb-6">
            To generate personalized educational content, we need to access the Gemini API.
          </p>
          <button
            onClick={handleApiKeySelection}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Connect Google Account
          </button>
          <div className="mt-4 text-xs text-slate-400">
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">
               Learn more about API billing
             </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${settings.highContrast ? 'bg-white text-black' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 font-sans`}>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setLesson(null); setConcept(""); setAudioBuffer(null);}}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">OmniLearn</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute right-4 top-16 bg-white border border-slate-200 shadow-xl rounded-xl p-4 w-64 animate-in slide-in-from-top-2">
            <h4 className="font-semibold mb-3 text-slate-800">Accessibility</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Text Size</label>
                <div className="flex bg-slate-100 rounded-lg mt-1 p-1">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSettings({...settings, textSize: size})}
                      className={`flex-1 py-1 rounded-md text-sm capitalize transition-colors ${settings.textSize === size ? 'bg-white shadow-sm text-indigo-600 font-medium' : 'text-slate-500'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Input Section */}
        {!lesson && (
          <div className="max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Master any concept.
              </h1>
              <p className="text-lg text-slate-600">
                From basic arithmetic to quantum mechanics, get detailed, rigorous explanations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
              <form onSubmit={handleGenerateLesson} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">What do you want to learn?</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      placeholder="e.g., Photosynthesis, The Theory of Relativity, Blockchain..."
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all text-lg"
                      required
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience Level</label>
                  <div className="relative">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none bg-slate-50"
                    >
                      {Object.values(DifficultyLevel).map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      Designing Lesson...
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} />
                      Generate Lesson
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Lesson Display */}
        {lesson && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            
            {/* Sidebar / Navigation (Mobile Top) */}
            <div className="lg:col-span-3 lg:sticky lg:top-24 h-fit space-y-4">
              <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
                <button
                  onClick={() => setActiveTab('learn')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'learn' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                  <BookOpen size={20} />
                  Detailed Explanation
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'quiz' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                  <Check size={20} />
                  Quiz & Practice
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                  <MessageCircle size={20} />
                  Ask AI Tutor
                </button>
              </nav>

              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 hidden lg:block">
                <h3 className="font-semibold text-indigo-900 mb-2">Key Takeaways</h3>
                <ul className="space-y-2">
                  {lesson.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-indigo-800">
                      <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-8">
              
              {/* Header Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                      {difficulty}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{lesson.title}</h1>
                    <p className="text-slate-600 text-lg leading-relaxed">{lesson.summary}</p>
                  </div>
                  
                  {/* Audio Controls */}
                  <div className="flex-shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                    {audioBuffer ? (
                       <AudioPlayer audioBuffer={audioBuffer} />
                    ) : (
                      <button 
                        onClick={handleTTS}
                        disabled={loadingAudio}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all text-indigo-600 font-semibold flex items-center gap-2 group w-full sm:w-auto justify-center"
                      >
                         {loadingAudio ? (
                           <Loader2 className="animate-spin text-indigo-500" size={20} />
                         ) : (
                           <Play size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                         )}
                         {loadingAudio ? "Generating..." : "Listen"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Content Based on Tab */}
              <div className="min-h-[400px]">
                {activeTab === 'learn' && (
                  <div className={`bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 ${getTextSizeClass()}`}>
                    <div className="prose prose-indigo max-w-none">
                      <div className="mb-8 p-6 bg-amber-50 rounded-xl border border-amber-100">
                        <h3 className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                          <Sparkles size={20} className="text-amber-500" />
                          Simple Analogy
                        </h3>
                        <p className="text-amber-800 italic text-lg">"{lesson.analogy}"</p>
                      </div>
                      
                      <MarkdownRenderer content={lesson.detailedExplanation} />
                    </div>
                  </div>
                )}

                {activeTab === 'quiz' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="mb-8">
                       <Quiz questions={lesson.quiz} />
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                     <ChatInterface lesson={lesson} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
