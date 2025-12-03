import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle, XCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface Props {
  questions: QuizQuestion[];
}

const Quiz: React.FC<Props> = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    if (selectedOption === currentQuestion.correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-fade-in">
        <div className="mb-6 inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600">
           {score === questions.length ? <CheckCircle size={48} /> : <CheckCircle size={48} className="opacity-50" />}
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Quiz Completed!</h3>
        <p className="text-slate-600 mb-6">You scored {score} out of {questions.length}</p>
        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw size={20} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Knowledge Check</h3>
        <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>
      
      <div className="p-6">
        <h4 className="text-lg font-medium text-slate-800 mb-6">{currentQuestion.question}</h4>
        
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, idx) => {
            let itemClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between group ";
            
            if (isSubmitted) {
              if (idx === currentQuestion.correctAnswerIndex) {
                itemClass += "border-green-500 bg-green-50 text-green-900";
              } else if (idx === selectedOption) {
                itemClass += "border-red-500 bg-red-50 text-red-900";
              } else {
                itemClass += "border-slate-100 opacity-50";
              }
            } else {
              if (idx === selectedOption) {
                itemClass += "border-indigo-600 bg-indigo-50 text-indigo-900";
              } else {
                itemClass += "border-slate-100 hover:border-indigo-200 hover:bg-slate-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={itemClass}
                disabled={isSubmitted}
              >
                <span className="font-medium">{option}</span>
                {isSubmitted && idx === currentQuestion.correctAnswerIndex && <CheckCircle size={20} className="text-green-600" />}
                {isSubmitted && idx === selectedOption && idx !== currentQuestion.correctAnswerIndex && <XCircle size={20} className="text-red-500" />}
              </button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
            <strong>Explanation:</strong> {currentQuestion.explanation}
          </div>
        )}

        <div className="flex justify-end">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;