import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Calculator, Lightbulb, Loader2 } from 'lucide-react';
import { LessonContent } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { getTutorResponse } from '../services/geminiService';

interface Props {
  lesson: LessonContent;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

const ChatInterface: React.FC<Props> = ({ lesson }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: `Hi! I'm your AI Tutor for **${lesson.title}**. \n\nI can help you: \n- **Simplify** complex parts \n- **Solve** advanced math problems \n- **Explain** with more examples. \n\nWhat's on your mind?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Convert internal message format to Gemini API history format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const responseText = await getTutorResponse(lesson, history, text);
      
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[600px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header */}
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
          <Bot size={20} />
        </div>
        <div>
          <h3 className="font-bold text-indigo-900">AI Tutor</h3>
          <p className="text-xs text-indigo-600 font-medium">Ask doubts, simplify concepts, or solve math</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 shadow-sm rounded-tl-none'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
               <Loader2 size={16} className="animate-spin" />
             </div>
             <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm">
               <span className="text-slate-400 text-sm animate-pulse">Thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => handleSend("Simplify this explanation like I'm 5 years old.")}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-full border border-amber-100 hover:bg-amber-100 transition-colors whitespace-nowrap"
          disabled={loading}
        >
          <Lightbulb size={14} />
          Simplify
        </button>
        <button 
          onClick={() => handleSend("Can you give me a difficult math problem related to this?")}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap"
          disabled={loading}
        >
          <Calculator size={14} />
          Math Problem
        </button>
        <button 
          onClick={() => handleSend("Give me a real-world example of this.")}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-100 hover:bg-green-100 transition-colors whitespace-nowrap"
          disabled={loading}
        >
          <Sparkles size={14} />
          Example
        </button>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about the lesson..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;