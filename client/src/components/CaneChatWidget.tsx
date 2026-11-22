import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  X,
  Maximize2,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  BookmarkPlus,
  AlertCircle,
  History,
  ChevronRight
} from 'lucide-react';
import { apiFetch, unwrapData } from '../utils/api';

type CaneLang = 'English' | 'Hindi' | 'Hinglish';
type CaneMode =
  | 'general'
  | 'career_discovery'
  | 'job_search'
  | 'skill_gap'
  | 'roadmap'
  | 'resume'
  | 'interview'
  | 'schemes';

const WELCOME_MSG =
  "Hey! I'm CANE, your personal career companion. Whether you're exploring careers, improving your skills, or preparing for your dream job, I'm here to help. What would you like to work on today?";

const SUGGESTED_PROMPTS = [
  'What career suits me based on my profile?',
  'I am a B.Tech student, but I do not enjoy coding. What jobs can I pursue?',
  'Create a 3-month roadmap to become a business analyst.',
  'Take my mock interview for an entry-level role.',
  'What government schemes can help me develop employment skills?',
  'Find opportunities matching my skills on SETU.'
];

const MODE_OPTIONS: Array<{ id: CaneMode; label: string }> = [
  { id: 'general', label: 'Career Chat' },
  { id: 'career_discovery', label: 'Explore Careers' },
  { id: 'job_search', label: 'Find Jobs' },
  { id: 'skill_gap', label: 'Skill Gap' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'resume', label: 'Resume Help' },
  { id: 'interview', label: 'Mock Interview' },
  { id: 'schemes', label: 'Govt Schemes' }
];

interface CaneWorkspaceProps {
  fullScreen?: boolean;
  initialPrompt?: string;
  initialMode?: CaneMode;
  onClose?: () => void;
}

export const CaneWorkspace: React.FC<CaneWorkspaceProps> = ({
  fullScreen = false,
  initialPrompt = '',
  initialMode = 'general',
  onClose
}) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [aiStatus, setAiStatus] = useState<{ configured: boolean; hint: string; model?: string }>({
    configured: true,
    hint: ''
  });
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(fullScreen);

  const [language, setLanguage] = useState<CaneLang>('English');
  const [mode, setMode] = useState<CaneMode>(initialMode);
  const [useProfileContext, setUseProfileContext] = useState(true);
  const [input, setInput] = useState(initialPrompt);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string>('');
  const [savedRoadmapMsgId, setSavedRoadmapMsgId] = useState<string>('');

  // Optional Voice controls
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const loadStatusAndConversations = async () => {
    const [stRes, listRes] = await Promise.all([
      apiFetch('/api/cane/status'),
      apiFetch('/api/cane/conversations')
    ]);
    if (stRes.ok && stRes.data) {
      const s = unwrapData(stRes.data);
      setAiStatus({
        configured: Boolean(s?.configured),
        hint: s?.configurationHint || '',
        model: s?.model || ''
      });
    }
    if (listRes.ok && listRes.data) {
      const list = unwrapData(listRes.data);
      setConversations(Array.isArray(list) ? list : []);
    }
  };

  useEffect(() => {
    loadStatusAndConversations();
  }, []);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const openConversation = async (convId: string) => {
    setError('');
    setActiveConvId(convId);
    const res = await apiFetch(`/api/cane/conversations/${convId}`);
    if (res.ok && res.data) {
      const data = unwrapData(res.data);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
      if (data?.conversation?.language) setLanguage(data.conversation.language);
      if (data?.conversation?.mode) setMode(data.conversation.mode);
      if (typeof data?.conversation?.useProfileContext === 'boolean') {
        setUseProfileContext(data.conversation.useProfileContext);
      }
    }
    if (!fullScreen) setShowHistory(false);
  };

  const handleNewChat = () => {
    setActiveConvId('');
    setMessages([]);
    setError('');
    setInput('');
    if (!fullScreen) setShowHistory(false);
  };

  const handleDeleteConversation = async (convId: string) => {
    const res = await apiFetch(`/api/cane/conversations/${convId}`, { method: 'DELETE' });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeConvId === convId) handleNewChat();
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    setError('');
    setSending(true);
    setInput('');

    // Optimistically show user message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { _id: tempId, role: 'user', content: text }]);

    try {
      let convId = activeConvId;
      if (!convId) {
        const createRes = await apiFetch('/api/cane/conversations', {
          method: 'POST',
          body: JSON.stringify({ language, mode, useProfileContext })
        });
        if (!createRes.ok) {
          setError(createRes.error || 'Could not start a new CANE conversation.');
          setSending(false);
          return;
        }
        const created = unwrapData(createRes.data);
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
          useProfileContext
        })
      });

      if (!res.ok) {
        setError(res.error || 'CANE could not respond right now.');
        if (res.data?.errors?.aiNotConfigured === true) {
          setAiStatus((prev) => ({ ...prev, configured: false }));
        }
      } else {
        const data = unwrapData(res.data);
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== tempId),
          data.userMessage,
          data.assistantMessage
        ]);
        if (data.conversation) {
          setConversations((prev) => [
            data.conversation,
            ...prev.filter((c) => c._id !== data.conversation._id)
          ]);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while messaging CANE.');
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeConvId || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await apiFetch(`/api/cane/conversations/${activeConvId}/regenerate`, {
        method: 'POST'
      });
      if (!res.ok) {
        setError(res.error || 'Could not regenerate response.');
      } else {
        const data = unwrapData(res.data);
        setMessages((prev) => {
          const trimmed =
            prev.length > 0 && prev[prev.length - 1].role === 'assistant'
              ? prev.slice(0, -1)
              : prev;
          return [...trimmed, data.assistantMessage];
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (msgId: string, feedback: 'up' | 'down') => {
    const res = await apiFetch(`/api/cane/messages/${msgId}/feedback`, {
      method: 'PATCH',
      body: JSON.stringify({ feedback })
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m._id === msgId ? { ...m, feedback } : m))
      );
    }
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(''), 1800);
  };

  const handleSaveRoadmap = async (msg: any) => {
    const firstLine =
      String(msg.content || '')
        .split('\n')
        .find((l) => l.trim().length > 4)
        ?.replace(/[#*]/g, '')
        .trim()
        .slice(0, 80) || 'My CANE Career Roadmap';

    const res = await apiFetch('/api/cane/roadmaps', {
      method: 'POST',
      body: JSON.stringify({
        title: firstLine,
        targetRole: firstLine,
        durationLabel: 'Custom Roadmap',
        content: msg.content
      })
    });
    if (res.ok) {
      setSavedRoadmapMsgId(msg._id);
    }
  };

  const handleToggleMic = () => {
    if (!voiceEnabled) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const handleSpeak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, '').slice(0, 700));
    utter.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utter);
  };

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden ${
        fullScreen
          ? 'h-[calc(100vh-8rem)] rounded-3xl border border-[#BDE0FE] shadow-baby'
          : 'h-[580px] max-h-[82vh] w-[94vw] sm:w-[430px] rounded-3xl border border-[#BDE0FE] shadow-baby-lg'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-[#EAF7FF] via-[#D6EEFF] to-[#FCE7F3]/70 border-b border-[#BDE0FE] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#60B6F8] to-[#F472B6] text-white flex items-center justify-center shadow-baby-sm shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-[#1E3A5F] font-display">CANE</h3>
              <span
                className={`w-2 h-2 rounded-full ${
                  aiStatus.configured ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                title={aiStatus.configured ? 'Live AI Active' : 'AI Key Needed'}
              />
            </div>
            <p className="text-[10px] text-[#475569] truncate">
              Career Assistance &amp; Navigation Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-[#1E3A5F] border border-[#D8ECFA]"
            title="Conversation History"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-[#1E3A5F] border border-[#D8ECFA]"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          {!fullScreen && (
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                navigate('/cane');
              }}
              className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-[#1E3A5F] border border-[#D8ECFA]"
              title="Expand to Full Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-[#64748B]"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controls Strip: Language, Profile Consent, Voice */}
      <div className="px-3.5 py-2 bg-[#F8FCFF] border-b border-[#EAF7FF] flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1">
          {(['English', 'Hindi', 'Hinglish'] as CaneLang[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-2 py-0.5 rounded-lg font-bold border transition ${
                language === lang
                  ? 'bg-[#EAF7FF] text-[#1E3A5F] border-[#60B6F8]'
                  : 'bg-white text-[#64748B] border-[#D8ECFA]'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <label className="inline-flex items-center gap-1 text-[#475569] font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={useProfileContext}
              onChange={(e) => setUseProfileContext(e.target.checked)}
              className="rounded border-[#A2D2FF]"
            />
            <span>Use my profile</span>
          </label>
          <button
            type="button"
            onClick={() => {
              if (voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
              setVoiceEnabled((v) => !v);
            }}
            className="text-[#64748B] hover:text-[#1E3A5F]"
            title={voiceEnabled ? 'Disable voice features' : 'Enable voice features'}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mode Pills */}
      <div className="px-3.5 py-2 bg-white border-b border-[#EAF7FF] flex gap-1.5 overflow-x-auto">
        {MODE_OPTIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap border transition ${
              mode === m.id
                ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] border-[#60B6F8]'
                : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main Split: History Sidebar + Messages */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {showHistory && (
          <div className="w-56 border-r border-[#EAF7FF] bg-[#F8FCFF] p-3 overflow-y-auto space-y-2 shrink-0">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full py-2 rounded-xl bg-white hover:bg-[#EAF7FF] border border-[#BDE0FE] text-xs font-bold text-[#1E3A5F] flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Chat
            </button>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] pt-1">
              Previous Chats ({conversations.length})
            </p>
            {conversations.length === 0 ? (
              <p className="text-[11px] text-[#64748B]">No saved chats yet.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c._id}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-1 cursor-pointer transition ${
                    activeConvId === c._id
                      ? 'bg-[#EAF7FF] border-[#60B6F8] text-[#1E3A5F] font-bold'
                      : 'bg-white border-[#D8ECFA] text-[#475569] hover:border-[#A2D2FF]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openConversation(c._id)}
                    className="truncate text-left flex-1"
                  >
                    {c.title || 'Career Chat'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(c._id)}
                    className="p-1 text-[#64748B] hover:text-rose-500"
                    title="Clear conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FCFF]/40">
          {!aiStatus.configured && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Live AI Provider Not Yet Configured:</strong>{' '}
                {aiStatus.hint ||
                  'Add GEMINI_API_KEY or OPENAI_API_KEY in backend environment variables to activate live CANE AI responses.'}
              </span>
            </div>
          )}

          {/* Welcome Bubble */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#60B6F8] to-[#F472B6] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-[#D8ECFA] rounded-2xl rounded-tl-sm p-3.5 text-xs text-[#334155] leading-relaxed shadow-xs max-w-[88%]">
              {WELCOME_MSG}
            </div>
          </div>

          {/* Suggested Prompts on Fresh Chat */}
          {messages.length === 0 && (
            <div className="space-y-1.5 pl-9">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Try Asking CANE:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="text-left text-[11px] font-medium px-3 py-1.5 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            const isLastAssistant = !isUser && idx === messages.length - 1;
            return (
              <div
                key={m._id || idx}
                className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : ''}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#60B6F8] to-[#F472B6] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed max-w-[86%] space-y-2 ${
                    isUser
                      ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] font-medium rounded-tr-sm'
                      : 'bg-white border border-[#D8ECFA] text-[#334155] rounded-tl-sm shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Grounded SETU Action Links */}
                  {!isUser && Array.isArray(m.links) && m.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.links.map((lk: any, i: number) => (
                        <Link
                          key={i}
                          to={lk.route}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE] text-[10px] font-bold"
                        >
                          <span>{lk.label}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Assistant Action Toolbar */}
                  {!isUser && m._id && (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-[#EAF7FF] text-[10px] text-[#64748B]">
                      <button
                        type="button"
                        onClick={() => handleCopy(m._id, m.content)}
                        className="inline-flex items-center gap-1 hover:text-[#1E3A5F]"
                      >
                        {copiedId === m._id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>

                      {voiceEnabled && (
                        <button
                          type="button"
                          onClick={() => handleSpeak(m.content)}
                          className="inline-flex items-center gap-1 hover:text-[#1E3A5F]"
                        >
                          <Volume2 className="w-3 h-3" /> Listen
                        </button>
                      )}

                      {isLastAssistant && (
                        <button
                          type="button"
                          onClick={handleRegenerate}
                          className="inline-flex items-center gap-1 hover:text-[#1E3A5F]"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                      )}

                      {String(m.content || '').length > 180 && (
                        <button
                          type="button"
                          onClick={() => handleSaveRoadmap(m)}
                          className="inline-flex items-center gap-1 hover:text-[#2589D6] font-semibold"
                        >
                          <BookmarkPlus className="w-3 h-3" />
                          <span>
                            {savedRoadmapMsgId === m._id ? 'Saved to Dashboard ✓' : 'Save Roadmap'}
                          </span>
                        </button>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleFeedback(m._id, 'up')}
                          className={`p-1 rounded ${
                            m.feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'hover:text-[#1E3A5F]'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m._id, 'down')}
                          className={`p-1 rounded ${
                            m.feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'hover:text-rose-600'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {sending && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#60B6F8] to-[#F472B6] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white border border-[#D8ECFA] text-xs text-[#64748B] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#60B6F8] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#A2D2FF] animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-pink-300 animate-bounce [animation-delay:240ms]" />
                <span className="ml-1">CANE is thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-3 bg-white border-t border-[#D8ECFA] flex items-center gap-2"
      >
        {voiceEnabled && (
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-2.5 rounded-2xl border transition shrink-0 ${
              listening
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#64748B] hover:text-[#1E3A5F]'
            }`}
            title={listening ? 'Stop voice input' : 'Speak to CANE'}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === 'Hindi'
              ? 'CANE से अपने करियर के बारे में पूछें...'
              : 'Ask CANE about careers, skills, jobs, interviews...'
          }
          className="flex-1 px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] focus:bg-white text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE]"
        />

        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] shadow-baby-sm disabled:opacity-40 transition shrink-0"
          aria-label="Send message to CANE"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export const CaneFloatingWidget: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && <CaneWorkspace onClose={() => setOpen(false)} />}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#60B6F8] via-[#A2D2FF] to-[#F9A8D4] text-[#1E3A5F] font-extrabold text-xs shadow-baby-lg border-2 border-white hover:scale-105 transition"
        aria-label="Open CANE AI Career Assistant"
      >
        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#2589D6] shadow-xs">
          {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
        </span>
        <span>{open ? 'Close CANE' : 'Ask CANE AI'}</span>
      </button>
    </div>
  );
};
