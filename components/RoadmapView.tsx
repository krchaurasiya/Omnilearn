import React from 'react';
import { Roadmap } from '../types';
import { CheckCircle2, Circle, Clock, BookOpen, ArrowRight } from 'lucide-react';

interface Props {
  roadmap: Roadmap;
  onTopicClick: (topic: string) => void;
}

const RoadmapView: React.FC<Props> = ({ roadmap, onTopicClick }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Learning Roadmap: {roadmap.concept}</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">{roadmap.description}</p>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {roadmap.steps.map((step, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-indigo-50 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="font-bold text-sm">{step.stepNumber}</span>
            </div>
            
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-slate-800">{step.title}</h3>
                <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  <Clock size={12} />
                  {step.estimatedTime}
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-4">{step.description}</p>
              
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Concepts to Master</h4>
                <div className="flex flex-wrap gap-2">
                  {step.topics.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => onTopicClick(topic)}
                      className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 group/btn"
                    >
                      {topic}
                      <ArrowRight size={10} className="opacity-0 group-hover/btn:opacity-100 -translate-x-1 group-hover/btn:translate-x-0 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapView;