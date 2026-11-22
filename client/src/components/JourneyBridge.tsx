import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
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
    <div className="bg-white rounded-3xl border border-[#D8ECFA] shadow-baby p-5 sm:p-7 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAF7FF] mb-5 gap-3">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 bg-[#EAF7FF] text-[#3B9EE8] rounded-2xl border border-[#D8ECFA]">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-[#334155] text-base sm:text-lg tracking-tight font-display">
              {language === 'hi' ? '7-चरणीय सेतु यात्रा' : 'The 7-Stage SETU Journey'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {language === 'hi'
                ? 'हुनर की खोज से लेकर प्रत्यक्ष कमाई तक की आपकी पूरी प्रगति'
                : 'From discovering your skills to landing verified opportunities'}
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3.5 py-1.5 bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] rounded-full self-start sm:self-auto">
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
              className={`group relative flex flex-col p-3.5 rounded-2xl border text-left transition-all ${
                isCurrent
                  ? 'border-[#A2D2FF] bg-[#EAF7FF] shadow-baby-sm ring-1 ring-[#BDE0FE]'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300'
                  : 'border-[#D8ECFA] bg-[#F8FCFF] hover:bg-[#EAF7FF]/60 hover:border-[#BDE0FE]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#64748B]">0{idx + 1}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isCurrent ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B9EE8] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3B9EE8]"></span>
                  </span>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-[#BDE0FE]" />
                )}
              </div>
              <span
                className={`text-xs font-bold leading-tight line-clamp-1 ${
                  isCurrent
                    ? 'text-[#1E3A5F]'
                    : isCompleted
                    ? 'text-emerald-700'
                    : 'text-[#334155]'
                }`}
              >
                {stage.label}
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{stage.sub}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
