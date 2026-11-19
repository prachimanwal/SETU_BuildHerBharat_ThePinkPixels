import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface JourneyBridgeProps {
  currentStage?: string;
  completedStages?: string[];
}

export const JourneyBridge: React.FC<JourneyBridgeProps> = ({
  currentStage,
  completedStages = []
}) => {
  const { t, language } = useLanguage();

  const stages = [
    { id: 'discover', label: t('stageDiscover'), path: '/profile', sub: language === 'hi' ? 'प्रोफ़ाइल और हुनर' : 'Profile & Skills' },
    { id: 'assess', label: t('stageAssess'), path: '/assess', sub: language === 'hi' ? 'कौशल परीक्षा' : 'Skill Tests' },
    { id: 'learn', label: t('stageLearn'), path: '/learn', sub: language === 'hi' ? 'ट्यूटोरियल' : 'Tutorials' },
    { id: 'practice', label: t('stagePractice'), path: '/learn?tab=assignments', sub: language === 'hi' ? 'व्यावहारिक कार्य' : 'Assignments' },
    { id: 'portfolio', label: t('stagePortfolio'), path: '/portfolio', sub: language === 'hi' ? 'प्रोजेक्ट्स' : 'Projects' },
    { id: 'opportunities', label: t('stageOpportunities'), path: '/opportunities', sub: language === 'hi' ? 'नौकरी व इंटर्नशिप' : 'Matched Roles' },
    { id: 'earn', label: t('stageEarn'), path: '/applications', sub: language === 'hi' ? 'साक्षात्कार व चयन' : 'Selection & Pay' }
  ];

  return (
    <div className="bg-[#151515] rounded-2xl border border-[#292929] shadow-xl p-5 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#242424] mb-5 gap-2">
        <div className="flex items-center space-x-3">
          <span className="p-2 bg-[#1C1C1C] text-[#FF5A1F] rounded-xl border border-[#292929]">
            <Sparkles className="w-5 h-5 text-[#FF5A1F]" />
          </span>
          <div>
            <h3 className="font-bold text-[#F5F5F5] text-base sm:text-lg tracking-tight">
              {language === 'hi' ? '7-चरणीय सेतु यात्रा' : 'The 7-Stage SETU Journey'}
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              {language === 'hi'
                ? 'हुनर की खोज से लेकर प्रत्यक्ष कमाई तक की आपकी पूरी प्रगति'
                : 'From discovering practical skills to real selection & income'}
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-[#1A1A1A] text-[#FF7847] border border-[#292929] rounded-full self-start sm:self-auto">
          {language === 'hi' ? 'हुनर से हक़ की कमाई तक' : 'Bridging Skills to Livelihood'}
        </div>
      </div>

      {/* Bridge Visual Track */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {stages.map((stage, idx) => {
          const isCompleted = completedStages.includes(stage.id);
          const isCurrent = currentStage === stage.id;

          return (
            <Link
              key={stage.id}
              to={stage.path}
              className={`group relative flex flex-col p-3 rounded-xl border text-left transition-all ${
                isCurrent
                  ? 'border-[#FF5A1F] bg-[#1C1C1C] shadow-[0_0_15px_rgba(255,90,31,0.25)] ring-1 ring-[#FF5A1F]'
                  : isCompleted
                  ? 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500/60'
                  : 'border-[#292929] bg-[#101010] hover:bg-[#151515] hover:border-[#383838]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#737373]">
                  0{idx + 1}
                </span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A1F] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF5A1F]"></span>
                  </span>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-[#555555]" />
                )}
              </div>
              <span className={`text-xs font-bold leading-tight line-clamp-1 ${
                isCurrent ? 'text-[#F5F5F5]' : isCompleted ? 'text-emerald-300' : 'text-[#D4D4D4]'
              }`}>
                {stage.label}
              </span>
              <span className="text-[11px] text-[#888888] mt-0.5 line-clamp-1">
                {stage.sub}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
