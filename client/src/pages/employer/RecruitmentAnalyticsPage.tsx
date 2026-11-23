import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, Briefcase, Award } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { apiFetch, unwrapData } from '../../utils/api';

export const RecruitmentAnalyticsPage: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (range === 'custom' && startDate && endDate) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }
    const res = await apiFetch(`/api/employer/analytics?${params.toString()}`);
    if (res.ok && res.data) {
      setData(unwrapData(res.data));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (range !== 'custom') {
      load();
    }
  }, [range]);

  const kpis = data?.kpis || {};
  const graphs = data?.graphs || {};
  const trends = graphs.applicationsOverTime || [];
  const funnel = graphs.recruitmentFunnel || [];
  const departments = graphs.hiringByDepartment || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">Recruitment Analytics</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time hiring performance computed directly from your MongoDB job, application, and interview records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: '7d', label: 'Last 7 days' },
            { id: '30d', label: 'Last 30 days' },
            { id: '90d', label: 'Last 90 days' },
            { id: 'custom', label: 'Custom range' }
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                range === opt.id
                  ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                  : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:bg-[#EAF7FF]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D8ECFA] text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D8ECFA] text-xs"
            />
          </div>
          <button
            type="button"
            onClick={load}
            disabled={!startDate || !endDate}
            className="px-4 py-2 rounded-xl bg-[#3B9EE8] text-white text-xs font-bold disabled:opacity-45"
          >
            Apply Range
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-[#64748B]">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Calculating recruitment metrics...</p>
        </div>
      ) : (
        <>
          {/* Conversion & Efficiency Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm">
              <TrendingUp className="w-5 h-5 text-[#3B9EE8]" />
              <p className="mt-3 text-2xl font-extrabold text-[#1E3A5F]">
                {kpis.interviewConversionRate !== null && kpis.interviewConversionRate !== undefined
                  ? `${kpis.interviewConversionRate}%`
                  : 'N/A'}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Interview Conversion Rate</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm">
              <Award className="w-5 h-5 text-emerald-600" />
              <p className="mt-3 text-2xl font-extrabold text-[#1E3A5F]">
                {kpis.offerAcceptanceRate !== null && kpis.offerAcceptanceRate !== undefined
                  ? `${kpis.offerAcceptanceRate}%`
                  : 'N/A'}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Offer Acceptance Rate</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm">
              <Clock className="w-5 h-5 text-indigo-600" />
              <p className="mt-3 text-2xl font-extrabold text-[#1E3A5F]">
                {kpis.avgTimeToHireDays !== null && kpis.avgTimeToHireDays !== undefined
                  ? `${kpis.avgTimeToHireDays} days`
                  : 'N/A'}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Average Time to Hire</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm">
              <Briefcase className="w-5 h-5 text-amber-600" />
              <p className="mt-3 text-2xl font-extrabold text-[#1E3A5F]">
                {kpis.activeVacancies ?? 0}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">Active Open Vacancies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Trends */}
            <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
              <h3 className="text-sm font-bold text-[#1E3A5F] mb-3">Application Trends</h3>
              {trends.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-xs text-[#64748B]">
                  <BarChart3 className="w-7 h-7 text-[#94A3B8] mb-1.5" />
                  No applications recorded in this date window.
                </div>
              ) : (
                <div className="h-60">
                  <Line
                    data={{
                      labels: trends.map((t: any) => t.date),
                      datasets: [
                        {
                          label: 'Applications',
                          data: trends.map((t: any) => t.count),
                          borderColor: '#3B9EE8',
                          backgroundColor: 'rgba(59, 158, 232, 0.16)',
                          fill: true,
                          tension: 0.35
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Recruitment Funnel */}
            <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
              <h3 className="text-sm font-bold text-[#1E3A5F] mb-3">Pipeline Conversion Funnel</h3>
              {!funnel.some((f: any) => f.count > 0) ? (
                <div className="h-56 flex flex-col items-center justify-center rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-xs text-[#64748B]">
                  <BarChart3 className="w-7 h-7 text-[#94A3B8] mb-1.5" />
                  No funnel activity in this period.
                </div>
              ) : (
                <div className="h-60">
                  <Bar
                    data={{
                      labels: funnel.map((f: any) => f.stage),
                      datasets: [
                        {
                          label: 'Candidates',
                          data: funnel.map((f: any) => f.count),
                          backgroundColor: '#6366F1',
                          borderRadius: 8
                        }
                      ]
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Hiring Activity by Department */}
          <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1E3A5F]">Hiring Activity by Department</h3>
            {departments.length === 0 ? (
              <p className="text-xs text-[#64748B] text-center py-8 bg-[#F8FCFF] rounded-2xl border border-dashed border-[#BDE0FE]">
                No department hiring activity yet. Add departments when creating job postings.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAF7FF] text-[#64748B] uppercase text-[11px]">
                      <th className="py-2.5 pr-4">Department</th>
                      <th className="py-2.5 px-4">Job Postings</th>
                      <th className="py-2.5 px-4">Applications</th>
                      <th className="py-2.5 pl-4">Confirmed Hires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAF7FF]">
                    {departments.map((d: any) => (
                      <tr key={d.department} className="hover:bg-[#F8FCFF]">
                        <td className="py-3 pr-4 font-bold text-[#1E3A5F]">{d.department}</td>
                        <td className="py-3 px-4 text-[#475569]">{d.jobs}</td>
                        <td className="py-3 px-4 font-semibold text-[#2589D6]">{d.applications}</td>
                        <td className="py-3 pl-4 font-bold text-emerald-700">{d.hires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
