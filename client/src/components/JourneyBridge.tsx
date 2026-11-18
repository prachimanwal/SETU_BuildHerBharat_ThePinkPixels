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
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-4 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 mb-5 gap-2">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900 text-base sm:text-lg">
              {language === 'hi' ? '7-चरणीय सेतु यात्रा' : 'The 7-Stage SETU Journey'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {language === 'hi'
                ? 'हुनर की खोज से लेकर प्रत्यक्ष कमाई तक की आपकी पूरी प्रगति'
                : 'From discovering practical skills to real selection & income'}
            </p>
          </div>
        </div>
        <div className="text-xs font-medium px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full self-start sm:self-auto">
          {language === 'hi' ? 'हुनर से हक़ की कमाई तक।' : 'Bridging Skills to Livelihood'}
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
                  ? 'border-orange-500 bg-orange-50/40 shadow-sm ring-1 ring-orange-500'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                  : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-stone-600">
                  0{idx + 1}
                </span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isCurrent ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-600"></span>
                  </span>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-stone-400" />
                )}
              </div>
              <span className={`text-xs font-semibold leading-tight line-clamp-1 ${
                isCurrent ? 'text-orange-950' : 'text-slate-800'
              }`}>
                {stage.label}
              </span>
              <span className="text-[11px] text-stone-600 mt-0.5 line-clamp-1">
                {stage.sub}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
