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
  MessageCircle,
  History,
  Map,
  Download,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { generateLessonPlan, generateRoadmap, textToSpeech } from './services/geminiService';
import { DifficultyLevel, LessonContent, Roadmap, UserSettings } from './types';
import MarkdownRenderer from './components/MarkdownRenderer';
import Quiz from './components/Quiz';
import AudioPlayer from './components/AudioPlayer';
import ChatInterface from './components/ChatInterface';
import RoadmapView from './components/RoadmapView';

const App: React.FC = () => {
  // State
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [concept, setConcept] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.ELEMENTARY);
  const [loading, setLoading] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'quiz' | 'chat' | 'roadmap'>('learn');
  
  // History State
  const [history, setHistory] = useState<LessonContent[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Audio State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState<UserSettings>({
    textSize: 'medium',
    highContrast: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Initialize
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyReady(hasKey);
      }
    };
    checkKey();
    
    // Load History
    const savedHistory = localStorage.getItem('omniLearn_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleApiKeySelection = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions
      setApiKeyReady(true);
    }
  };

  const saveToHistory = (newLesson: LessonContent) => {
    const updatedHistory = [newLesson, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('omniLearn_history', JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('omniLearn_history', JSON.stringify(updated));
  };

  const loadLesson = (savedLesson: LessonContent) => {
    setLesson(savedLesson);
    setConcept(savedLesson.title); // Update search box to match
    setActiveTab('learn');
    setShowHistory(false);
    setAudioBuffer(null);
    setRoadmap(null);
  };

  const isQuotaError = (error: any): boolean => {
    const msg = error?.message || '';
    const code = error?.status || error?.code;
    const errString = JSON.stringify(error);
    return code === 429 || msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED') || errString.includes('RESOURCE_EXHAUSTED');
  };

  const handleGenerateLesson = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!concept.trim()) return;

    setLoading(true);
    setLesson(null);
    setAudioBuffer(null);
    setRoadmap(null);
    setActiveTab('learn');

    try {
      const data = await generateLessonPlan(concept, difficulty);
      setLesson(data);
      saveToHistory(data);
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

  const handleGenerateRoadmap = async () => {
    if (!concept.trim()) return;
    
    setLoadingRoadmap(true);
    setLesson(null);
    setRoadmap(null);
    setAudioBuffer(null);
    setActiveTab('roadmap');

    try {
      const data = await generateRoadmap(concept);
      setRoadmap(data);
    } catch (error: any) {
      console.error(error);
      if (isQuotaError(error)) {
        alert("Quota exceeded for roadmap generation.");
      } else {
        alert("Failed to generate roadmap.");
      }
    } finally {
      setLoadingRoadmap(false);
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

  const handleDownloadPDF = async () => {
    const elementId = roadmap ? 'roadmap-container' : 'lesson-container';
    const element = document.getElementById(elementId);
    
    if (!element) return;
    
    setGeneratingPdf(true);
    const title = lesson?.title || roadmap?.concept || 'document';
    
    const opt = {
      margin: 0.5,
      filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      await window.html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("PDF Generation failed:", e);
      alert("Failed to generate PDF. Falling back to print mode.");
      window.print();
    } finally {
      setGeneratingPdf(false);
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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setLesson(null); setRoadmap(null); setConcept(""); setAudioBuffer(null);}}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">OmniLearn</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 flex items-center gap-2"
              title="My Library"
            >
              <History size={20} />
              <span className="hidden sm:inline font-medium text-sm">Library</span>
            </button>
            <div className="w-px h-6 bg-slate-200"></div>
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

      {/* History Sidebar */}
      {showHistory && (
        <>
          <div className="fixed inset-0 bg-black/20 z-50 backdrop-blur-sm transition-opacity no-print" onClick={() => setShowHistory(false)}></div>
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 animate-in slide-in-from-right no-print">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                  <History className="text-indigo-600" size={24} />
                  My Library
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No lessons saved yet.</p>
                    <p className="text-sm">Generate a lesson to see it here.</p>
                  </div>
                ) : (
                  history.map((h) => (
                    <div 
                      key={h.id} 
                      onClick={() => loadLesson(h)}
                      className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-white relative"
                    >
                      <h4 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{h.title}</h4>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{h.summary}</p>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                        <button 
                          onClick={(e) => deleteFromHistory(h.id, e)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Input Section */}
        {(!lesson && !roadmap) && (
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

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="submit"
                    disabled={loading || loadingRoadmap}
                    className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        Designing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} />
                        Generate Lesson
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateRoadmap}
                    disabled={loading || loadingRoadmap}
                    className="py-4 bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 font-bold rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                  >
                    {loadingRoadmap ? (
                       <>
                         <Loader2 className="animate-spin" size={24} />
                         Planning...
                       </>
                    ) : (
                       <>
                         <Map size={24} />
                         Generate Roadmap
                       </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Roadmap Display */}
        {roadmap && !lesson && (
          <div id="roadmap-container" className="max-w-4xl mx-auto">
             <div className="mb-6 flex items-center justify-between no-print" data-html2canvas-ignore="true">
               <button onClick={() => setRoadmap(null)} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors">
                 <X size={16} /> Back
               </button>
               <button
                 onClick={handleDownloadPDF}
                 disabled={generatingPdf}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
               >
                 {generatingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                 {generatingPdf ? "Saving..." : "Download Roadmap PDF"}
               </button>
             </div>
             <RoadmapView 
                roadmap={roadmap} 
                onTopicClick={(topic) => {
                  setConcept(topic);
                  handleGenerateLesson();
                }} 
             />
          </div>
        )}

        {/* Lesson Display */}
        {lesson && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            
            {/* Sidebar / Navigation (Mobile Top) */}
            <div className="lg:col-span-3 lg:sticky lg:top-24 h-fit space-y-4 no-print">
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

              {/* Action Buttons */}
               <div className="space-y-2">
                 <button
                   onClick={handleDownloadPDF}
                   disabled={generatingPdf}
                   className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                 >
                   {generatingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                   {generatingPdf ? "Generating PDF..." : "Download Notes"}
                 </button>
                 <button
                   onClick={() => { setConcept(lesson.title); handleGenerateRoadmap(); }}
                   className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                 >
                   <Map size={18} />
                   View Roadmap
                 </button>
               </div>
            </div>

            {/* Main Content Area */}
            <div id="lesson-container" className="lg:col-span-9 space-y-8 print:col-span-12">
              
              {/* Header Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden print:border-none print:shadow-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none no-print" data-html2canvas-ignore="true"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3 no-print" data-html2canvas-ignore="true">
                      {difficulty}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{lesson.title}</h1>
                    <p className="text-slate-600 text-lg leading-relaxed">{lesson.summary}</p>
                  </div>
                  
                  {/* Audio Controls */}
                  <div className="flex-shrink-0 mt-4 sm:mt-0 w-full sm:w-auto no-print" data-html2canvas-ignore="true">
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
                  <div className={`bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 ${getTextSizeClass()} print:shadow-none print:border-none print:p-0`}>
                    <div className="prose prose-indigo max-w-none">
                      <div className="mb-8 p-6 bg-amber-50 rounded-xl border border-amber-100 no-print">
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
                  <div className="animate-in fade-in slide-in-from-bottom-2 no-print">
                    <div className="mb-8">
                       <Quiz questions={lesson.quiz} />
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 no-print">
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