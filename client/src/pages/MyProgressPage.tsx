import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  TrendingUp,
  Award,
  BookOpen,
  Layers,
  Briefcase,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { JourneyBridge } from '../components/JourneyBridge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export const MyProgressPage: React.FC = () => {
  const { language } = useLanguage();

  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/seeker/progress', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProgress(data))
      .catch((err) => console.error('Failed to load progress analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-stone-600">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Computing your real recorded progress...</p>
      </div>
    );
  }

  const isFresh = progress?.isFreshAccount;

  // Chart 1: Application Status Funnel Data (Doughnut)
  const appStatusCounts = progress?.applications?.statusCounts || {};
  const statusLabels = Object.keys(appStatusCounts);
  const statusValues = Object.values(appStatusCounts) as number[];

  const doughnutData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: [
          '#3b82f6', // Applied
          '#f59e0b', // Under Review
          '#8b5cf6', // Shortlisted
          '#10b981', // Interview Scheduled
          '#059669', // Selected
          '#94a3b8'  // Rejected
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart 2: Assessment Scores History
  const history = progress?.assessments?.history || [];
  const barData = {
    labels: history.map((h: any, idx: number) => `Attempt ${idx + 1} (${h.domain})`),
    datasets: [
      {
        label: 'Score (%)',
        data: history.map((h: any) => h.percentage),
        backgroundColor: '#e65100',
        borderRadius: 6
      }
    ]
  };

  const barOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`
        }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-stone-200">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-orange-700">
          <TrendingUp className="w-4 h-4" />
          <span>Stage 8: My Progress & Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          {language === 'hi' ? 'मेरी प्रगति और डेटा चार्ट' : 'Recorded Activity & Progress Analytics'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
          Visual graphs derived strictly from your saved records: assessment scores, completed learning assignments, portfolio deliverables, and application stages.
        </p>
      </div>

      {/* Fresh Account Empty State */}
      {isFresh && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-6 sm:p-8 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Your Journey Begins Here!</h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              You haven't completed any assessments or applications yet. Complete your first action to see live Chart.js visualizations here.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/assess"
              className="px-4 py-2 bg-[#E65100] text-white font-bold text-xs rounded-lg hover:bg-orange-700 transition"
            >
              Take 1st Assessment
            </Link>
            <Link
              to="/opportunities"
              className="px-4 py-2 border border-stone-300 bg-white text-stone-800 font-bold text-xs rounded-lg hover:bg-stone-50 transition"
            >
              Explore Opportunities
            </Link>
          </div>
        </div>
      )}

      {/* 7-Stage Visual Journey Bridge */}
      <JourneyBridge
        completedStages={
          progress?.journeyStages
            ?.filter((s: any) => s.completed)
            ?.map((s: any) => s.id) || ['discover']
        }
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Journey Completion
          </span>
          <div className="text-2xl font-black text-orange-600 font-serif">
            {progress?.journeyPercentage || 0}%
          </div>
          <p className="text-[11px] text-stone-600">Across 7 core SETU stages</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Assessments Taken
          </span>
          <div className="text-2xl font-black text-slate-900 font-serif">
            {progress?.assessments?.totalAttempts || 0}
          </div>
          <p className="text-[11px] text-stone-600">Evaluated on server</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Practice Deliverables
          </span>
          <div className="text-2xl font-black text-slate-900 font-serif">
            {progress?.learning?.completedCount || 0}
          </div>
          <p className="text-[11px] text-stone-600">Added to your portfolio</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Direct Applications
          </span>
          <div className="text-2xl font-black text-slate-900 font-serif">
            {progress?.applications?.total || 0}
          </div>
          <p className="text-[11px] text-stone-600">Active recruiter reviews</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chart 1: Application Funnel */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-slate-900 text-sm font-serif flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-orange-600" />
              <span>Application Pipeline by Status</span>
            </h3>
            <span className="text-xs font-semibold text-stone-500">
              Total: {progress?.applications?.total || 0}
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {progress?.applications?.total > 0 ? (
              <Doughnut
                data={doughnutData}
                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
              />
            ) : (
              <p className="text-xs text-stone-400 italic">No applications recorded yet</p>
            )}
          </div>
        </div>

        {/* Chart 2: Assessment Scores */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-slate-900 text-sm font-serif flex items-center space-x-2">
              <Award className="w-4 h-4 text-orange-600" />
              <span>Skill Assessment Performance</span>
            </h3>
            <span className="text-xs font-semibold text-stone-500">
              {history.length} Attempt(s)
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {history.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <p className="text-xs text-stone-400 italic">No assessment attempts completed yet</p>
            )}
          </div>
        </div>
      </div>

      {/* 7-Stage Detailed Progress Tracker */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm font-serif">
          7-Stage Journey Audit Trail
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {progress?.journeyStages?.map((stage: any, idx: number) => (
            <div
              key={stage.id}
              className={`p-3 rounded-xl border text-left space-y-1 ${
                stage.completed
                  ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950'
                  : 'border-stone-200 bg-stone-50 text-stone-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold">0{idx + 1}</span>
                {stage.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-semibold text-stone-600">Pending</span>
                )}
              </div>
              <h5 className="font-bold text-xs">{stage.label}</h5>
              <p className="text-[10px] text-stone-600 leading-snug">{stage.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
