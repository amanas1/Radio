
import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { XMarkIcon, ArrowLeftIcon, PlayIcon } from './Icons';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose, language }) => {
  const [step, setStep] = useState(0);
  const t = TRANSLATIONS[language];

  const steps = [
    { title: t.tutorialWelcome, content: t.tutorialStep1, pos: 'top-20 left-72' },
    { title: t.manualSection2.split(':')[0], content: t.tutorialStep2, pos: 'top-1/3 left-1/2 -translate-x-1/2' },
    { title: t.manualSection3.split(':')[0], content: t.tutorialStep3, pos: 'bottom-28 left-1/2 -translate-x-1/2' },
    { title: t.manualSection5.split(':')[0], content: t.tutorialStep4, pos: 'bottom-28 right-10' },
    { title: t.manualSection4.split(':')[0], content: t.tutorialStep5, pos: 'top-20 right-10' },
  ];

  if (!isOpen) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
      
      <div className={`absolute pointer-events-auto transition-all duration-500 ${current.pos}`}>
        <div className="w-80 glass-panel p-6 rounded-[2rem] shadow-[0_0_50px_rgba(139,92,246,0.3)] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Step {step + 1} / {steps.length}</span>
                <button onClick={onClose} className="p-1 text-slate-500 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
            </div>
            
            <h4 className="text-xl font-bold text-white mb-2">{current.title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">{current.content}</p>
            
            <div className="flex gap-2">
                {step > 0 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setStep(s => s - 1); }} 
                        className="flex-1 py-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all text-xs font-bold"
                    >
                        Back
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); if (step < steps.length - 1) setStep(s => s + 1); else onClose(); }} 
                    className="flex-[2] py-3 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all text-xs font-bold"
                >
                    {step < steps.length - 1 ? t.next : t.gotIt}
                </button>
            </div>
        </div>
        
        {/* Pointer Triangle */}
        <div className={`absolute w-4 h-4 bg-[var(--panel-bg)] rotate-45 border border-white/10 ${step === 0 ? '-left-2 top-10' : step === 4 ? '-right-2 top-10' : '-bottom-2 left-1/2 -translate-x-1/2'}`}></div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
