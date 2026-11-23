import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { apiFetch, extractArray, unwrapData } from '../../utils/api';

const RECRUITER_MODES = [
  { id: 'recruiter_general', label: 'Recruiter Assistant' },
  { id: 'jd_writer', label: 'Write Job Description' },
  { id: 'hiring_criteria', label: 'Hiring Criteria' },
  { id: 'interview_questions', label: 'Interview Questions' },
  { id: 'candidate_summary', label: 'Summarize Qualifications' },
  { id: 'candidate_compare', label: 'Compare vs Role' },
  { id: 'skill_gap_explain', label: 'Explain Skill Gaps' },
  { id: 'outreach_message', label: 'Candidate Messages' },
  { id: 'recruitment_strategy', label: 'Hiring Strategy' }
] as const;

const QUICK_PROMPTS = [
  'Draft an inclusive, skills-first job description for an entry-level Business Analyst.',
  'Suggest 8 structured interview questions with fair evaluation rubrics for a React developer.',
  'Review our active job postings and suggest hiring criteria focused on practical skills.',
  'Draft a warm, professional interview invitation message for a shortlisted candidate.'
];

export const CaneRecruiterPage: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [mode, setMode] = useState<string>('recruiter_general');
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [useCompanyContext, setUseCompanyContext] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const [stRes, convRes] = await Promise.all([
      apiFetch('/api/cane/status'),
      apiFetch('/api/cane/conversations')
    ]);
    if (stRes.ok && stRes.data) setStatusInfo(unwrapData(stRes.data));
    if (convRes.ok) {
      const list = extractArray(convRes.data);
      setConversations(list);
      if (!activeConvId && list.length > 0) {
        selectConversation(list[0]._id);
      }
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    setError('');
    const res = await apiFetch(`/api/cane/conversations/${id}`);
    if (res.ok && res.data) {
      const d = unwrapData(res.data);
      setMessages(Array.isArray(d?.messages) ? d.messages : []);
      if (d?.conversation?.mode) setMode(d.conversation.mode);
      if (d?.conversation?.language) setLanguage(d.conversation.language);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = async () => {
    const res = await apiFetch('/api/cane/conversations', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Recruiter Chat',
        language,
        mode,
        useProfileContext: useCompanyContext
      })
    });
    if (res.ok && res.data) {
      const created = unwrapData(res.data);
      setConversations((prev) => [created, ...prev]);
      setActiveConvId(created._id);
      setMessages([]);
      setError('');
    }
  };

  const deleteConv = async (id: string) => {
    const res = await apiFetch(`/api/cane/conversations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    if (!textOverride) setInput('');

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { _id: tempId, role: 'user', content: text }]);

    try {
      let convId = activeConvId;
      if (!convId) {
        const createdRes = await apiFetch('/api/cane/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: text.slice(0, 48),
            language,
            mode,
            useProfileContext: useCompanyContext
          })
        });
        if (!createdRes.ok) {
          setError(createdRes.error || 'Could not start CANE Recruiter chat.');
          setSending(false);
          return;
        }
        const created = unwrapData(createdRes.data);
        convId = created._id;
        setActiveConvId(convId);
        setConversations((prev) => [created, ...prev]);
      }

      const res = await apiFetch(`/api/cane/conversations/${convId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: text,
          language,
          mode,
          useProfileContext: useCompanyContext
        })
      });

      if (!res.ok) {
        setError(res.error || 'CANE AI Recruiter could not respond right now.');
      } else {
        const d = unwrapData(res.data);
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== tempId),
          d.userMessage,
          d.assistantMessage
        ]);
        if (d.conversation) {
          setConversations((prev) => [
            d.conversation,
            ...prev.filter((c) => c._id !== d.conversation._id)
          ]);
        }
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ethical Advisory Guardrail Banner */}
      <div className="p-4 rounded-3xl bg-[#EAF7FF] border border-[#BDE0FE] flex items-start gap-3 text-xs text-[#1E3A5F]">
        <ShieldCheck className="w-5 h-5 text-[#2589D6] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Ethical & Advisory AI Recruiting Policy</p>
          <p className="text-[#475569] mt-0.5">
            CANE AI Recruiter is powered by SETU&apos;s secure Gemini backend to assist with job descriptions, objective rubrics, interview questions, and candidate summaries. All outputs are strictly advisory — human employers make every hiring decision, and CANE never auto-rejects or ranks candidates by protected personal characteristics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[580px]">
        {/* Left Sidebar: Conversations */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-4 shadow-baby-sm flex flex-col gap-3">
          <button
            type="button"
            onClick={startNewChat}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> New Recruiter Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[460px]">
            {conversations.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-6">No saved chats yet.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c._id}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-2xl text-xs cursor-pointer transition ${
                    activeConvId === c._id
                      ? 'bg-[#EAF7FF] text-[#1E3A5F] font-semibold border border-[#BDE0FE]'
                      : 'text-[#475569] hover:bg-[#F8FCFF]'
                  }`}
                  onClick={() => selectConversation(c._id)}
                >
                  <span className="truncate">{c.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConv(c._id);
                    }}
                    className="text-[#94A3B8] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Workspace */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#D8ECFA] shadow-baby-sm flex flex-col overflow-hidden">
          {/* Controls Header */}
          <div className="p-4 border-b border-[#EAF7FF] bg-[#F8FCFF] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#EAF7FF] text-[#2589D6]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1E3A5F]">CANE AI Recruiter</h2>
                <p className="text-[11px] text-[#64748B]">
                  {statusInfo?.configured
                    ? `Connected via Gemini (${statusInfo.model})`
                    : 'Waiting for backend Gemini API configuration'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[#D8ECFA] bg-white text-xs font-medium"
              >
                {RECRUITER_MODES.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-[#D8ECFA] bg-white text-xs font-medium"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
              </select>
              <label className="inline-flex items-center gap-1.5 text-[11px] text-[#475569] px-2">
                <input
                  type="checkbox"
                  checked={useCompanyContext}
                  onChange={(e) => setUseCompanyContext(e.target.checked)}
                />
                <span>Use company & jobs context</span>
              </label>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[440px]">
            {messages.length === 0 ? (
              <div className="py-6 space-y-4 text-center">
                <Sparkles className="w-8 h-8 text-[#3B9EE8] mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-[#1E3A5F]">How can CANE assist your hiring today?</h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    Choose a recruiter prompt below or type your own hiring question.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left max-w-2xl mx-auto">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(qp)}
                      className="p-3 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] border border-[#D8ECFA] text-xs text-[#1E3A5F] transition"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m._id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-[#3B9EE8] text-white'
                        : 'bg-[#F8FCFF] border border-[#D8ECFA] text-[#1E3A5F]'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3B9EE8]" />
                <span>CANE AI Recruiter is drafting your advisory response...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-4 mb-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-4 border-t border-[#EAF7FF] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CANE to write a JD, interview questions, skill-gap summary, or candidate message..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
