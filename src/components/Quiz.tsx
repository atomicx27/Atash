import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check } from 'lucide-react';

export const QUESTIONS = [
  {
    question: "Dhansak on Sundays:",
    options: ["Absolutely Mandatory", "Only on non-auspicious days", "I prefer Patra ni Macchi", "Optional"]
  },
  {
    question: "Would you raise your children in the Zoroastrian faith?",
    options: ["Yes, very important to me", "Yes, but with a modern approach", "We can decide together", "Not a priority"]
  },
  {
    question: "Ideal weekend morning:",
    options: ["Bun Maska at an Irani Cafe", "Sleeping in late", "Morning run at Marine Drive", "Family brunch"]
  },
  {
    question: "How often do you visit the Agiary?",
    options: ["Weekly", "On auspicious days/Navroze", "Rarely, but I'm spiritual", "Only for weddings/Navjotes"]
  },
  {
    question: "Favorite traditional dessert?",
    options: ["Lagan nu Custard", "Ravo", "Falooda", "Sev"]
  }
];

interface QuizProps {
  onComplete?: (answers: Record<number, number>) => void;
  standalone?: boolean;
}

export function Quiz({ onComplete, standalone = true }: QuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);

  const handleSelect = (idx: number) => {
    const newAnswers = { ...answers, [currentQ]: idx };
    setAnswers(newAnswers);
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(prev => prev + 1);
      } else {
        if (onComplete) {
          onComplete(newAnswers);
        } else {
          setCompleted(true);
        }
      }
    }, 400);
  };

  const calculateScore = () => {
    let total = 0;
    Object.values(answers).forEach((val) => { total += Number(val); });
    // Maps 0-15 to roughly 75-97%
    return Math.floor(75 + ((15 - total) * 1.46));
  };

  return (
    <div className="min-h-full flex flex-col px-6 pt-16 pb-8 bg-ivory">
      {!completed ? (
        <>
          <div className="mb-8">
            <h2 className="text-2xl text-maroon-900 serif font-bold tracking-tight mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Compatibility Quiz
            </h2>
            <div className="flex gap-1.5">
              {QUESTIONS.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentQ ? 'bg-amber-500' : 'bg-neutral-200'}`} />
              ))}
            </div>
            <div className="mt-2 text-xs font-medium text-neutral-400 font-sans uppercase tracking-widest">
              Question {currentQ + 1} of {QUESTIONS.length}
            </div>
          </div>

          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0"
              >
                <h3 className="text-3xl serif font-medium text-neutral-900 mb-8 leading-tight">
                  {QUESTIONS[currentQ]?.question}
                </h3>

                <div className="space-y-3">
                  {QUESTIONS[currentQ]?.options.map((opt, idx) => {
                    const isSelected = answers[currentQ] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all ${
                          isSelected 
                            ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm' 
                            : 'bg-white border-neutral-100 text-neutral-700 hover:border-neutral-200'
                        }`}
                      >
                        <div className="flex justify-between items-center text-sm font-medium">
                          {opt}
                          {isSelected && <Check className="w-5 h-5 text-amber-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center pb-12"
        >
          <div className="w-32 h-32 bg-maroon-50 rounded-full flex flex-col items-center justify-center mb-6 border border-maroon-100 shadow-inner relative">
            <motion.div 
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="absolute -top-3 -right-3 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-4 border-ivory"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-4xl font-serif font-bold text-maroon-900 border-b border-amber-500 mb-1 pb-1 leading-none">
              {calculateScore()}%
            </span>
            <span className="text-[10px] text-maroon-800 uppercase tracking-widest font-bold">Base Match</span>
          </div>
          <h2 className="text-3xl serif font-bold text-maroon-900 mb-3 tracking-tight">Profile Calibrated</h2>
          <p className="text-neutral-600 font-sans leading-relaxed mb-8 px-4">
            We've generated your base compatibility score. You'll now see highly accurate match ratings on your discover feed based on shared values.
          </p>
          <button 
            onClick={() => {setCurrentQ(0); setAnswers({}); setCompleted(false);}}
            className="text-amber-600 font-medium font-sans text-sm tracking-wide uppercase hover:text-amber-700 active:scale-95 transition-transform"
          >
            Retake Quiz
          </button>
        </motion.div>
      )}
    </div>
  );
}
