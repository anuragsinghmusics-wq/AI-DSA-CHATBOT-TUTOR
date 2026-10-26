'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  X,
  Check,
  Trash2,
  Plus,
  Loader2,
  GraduationCap,
  Target,
  Code2,
  AlertTriangle,
  Lightbulb,
  Award,
  Layers,
} from 'lucide-react';
import {
  getUserProfile,
  updateUserProfile,
  addUserMemory,
  deleteUserMemory,
  clearUserMemories,
} from '@/lib/api';
import type { UserProfile, UserMemory, MemoryCategory } from '@/types';

interface LearnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: UserProfile, memories: UserMemory[]) => void;
}

const CATEGORY_META: Record<
  MemoryCategory,
  { label: string; icon: React.ReactNode; badge: string; border: string; bg: string }
> = {
  WEAKNESS: {
    label: 'Weakness / Blindspot',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-rose-100 hover:border-rose-300',
    bg: 'bg-rose-50/20',
  },
  STRENGTH: {
    label: 'Mastered / Strength',
    icon: <Award className="w-3.5 h-3.5 text-emerald-600" />,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-100 hover:border-emerald-300',
    bg: 'bg-emerald-50/20',
  },
  LEARNING_STYLE: {
    label: 'Learning Preference',
    icon: <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />,
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    border: 'border-indigo-100 hover:border-indigo-300',
    bg: 'bg-indigo-50/20',
  },
  MILESTONE: {
    label: 'Milestone',
    icon: <Target className="w-3.5 h-3.5 text-amber-600" />,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-amber-100 hover:border-amber-300',
    bg: 'bg-amber-50/20',
  },
};

export function LearnerProfileModal({ isOpen, onClose, onProfileUpdated }: LearnerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'memories'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile Form state
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [preferredLanguage, setPreferredLanguage] = useState('cpp');
  const [learningGoals, setLearningGoals] = useState('');

  // Memories state
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // New Memory state
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<MemoryCategory>('LEARNING_STYLE');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getUserProfile();
        if (!isMounted) return;
        if (data.user?.name && data.user.name !== 'Dev User' && data.user.name !== 'Alex (DSA Learner)') {
          setName(data.user.name);
        } else if (data.profile?.name) {
          setName(data.profile.name);
        }
        if (data.profile) {
          setCurrentProfile(data.profile);
          setSkillLevel(data.profile.skillLevel || 'BEGINNER');
          setPreferredLanguage(data.profile.preferredLanguage || 'cpp');
          setLearningGoals(data.profile.learningGoals || '');
        }
        setMemories(data.memories || []);
      } catch (err) {
        console.error('Failed to load user profile & memory:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updateUserProfile({
        name,
        skillLevel,
        preferredLanguage,
        learningGoals,
      });
      setCurrentProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onProfileUpdated?.(updated, memories);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getEffectiveProfile = (): UserProfile => {
    return (
      currentProfile || {
        id: '',
        userId: '',
        name,
        skillLevel,
        preferredLanguage,
        learningGoals,
      }
    );
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    setIsAddingMemory(true);
    try {
      const created = await addUserMemory({
        category: newMemoryCategory,
        content: newMemoryText.trim(),
      });
      const updated = [created, ...memories];
      setMemories(updated);
      setNewMemoryText('');
      onProfileUpdated?.(getEffectiveProfile(), updated);
    } catch (err) {
      console.error('Failed to add memory:', err);
    } finally {
      setIsAddingMemory(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteUserMemory(id);
      const updated = memories.filter((m) => m.id !== id);
      setMemories(updated);
      onProfileUpdated?.(getEffectiveProfile(), updated);
    } catch (err) {
      console.error('Failed to delete memory:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAllMemories = async () => {
    if (!window.confirm('Are you sure you want to clear all AI memories? The AI will forget past insights and start fresh.')) {
      return;
    }
    setIsClearingAll(true);
    try {
      await clearUserMemories();
      setMemories([]);
      onProfileUpdated?.(getEffectiveProfile(), []);
    } catch (err) {
      console.error('Failed to clear memories:', err);
    } finally {
      setIsClearingAll(false);
    }
  };

  const filteredMemories =
    filterCategory === 'ALL'
      ? memories
      : memories.filter((m) => m.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50/40 via-white to-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                  Learner Profile & AI Memory
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 border border-brand-200">
                  LTM Active
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Personalize explanations and manage long-term AI observations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-gray-100 bg-white gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'profile'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Personalization & Goals
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'memories'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Long-Term Memories ({memories.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-xs">Loading learner profile & memories…</p>
            </div>
          ) : activeTab === 'profile' ? (
            /* Tab 1: Profile & Preferences */
            <div className="space-y-6">
              {/* Learner Name */}
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Harsh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-gray-400"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Deebug will address you by name and remember your profile across all chats and problems.
                </p>
              </div>

              {/* Skill Level Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  DSA Skill Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      level: 'BEGINNER' as const,
                      title: 'Beginner',
                      desc: 'Needs step-by-step guidance, intuitive analogies, and syntax hints.',
                    },
                    {
                      level: 'INTERMEDIATE' as const,
                      title: 'Intermediate',
                      desc: 'Comfortable with basics. Focus on time/space tradeoffs and patterns.',
                    },
                    {
                      level: 'ADVANCED' as const,
                      title: 'Advanced',
                      desc: 'Prefers concise hints, edge cases, bit tricks, and system constraints.',
                    },
                  ].map((item) => (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setSkillLevel(item.level)}
                      className={`text-left p-3.5 rounded-2xl border transition-all duration-150 ${
                        skillLevel === item.level
                          ? 'border-brand-500 bg-orange-50/40 ring-2 ring-brand-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900">{item.title}</span>
                        {skillLevel === item.level && (
                          <Check className="w-4 h-4 text-brand-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Primary Coding Language
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { key: 'cpp', label: 'C++' },
                    { key: 'python', label: 'Python' },
                    { key: 'java', label: 'Java' },
                    { key: 'javascript', label: 'JavaScript' },
                  ].map((lang) => (
                    <button
                      key={lang.key}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.key)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                        preferredLanguage === lang.key
                          ? 'border-brand-500 bg-orange-50/50 text-brand-700 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Goals */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Learning Goals & Target Focus
                  </label>
                  <span className="text-[11px] text-gray-400">Optional</span>
                </div>
                <textarea
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder="e.g. Preparing for FAANG technical rounds, focusing on Dynamic Programming and Graphs..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-800 placeholder-gray-400"
                />
              </div>

              {/* Save Button & Status */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs">
                  {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold animate-fade-in">
                      <Check className="w-4 h-4" /> Preferences saved!
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm shadow-brand-500/25 disabled:opacity-50 transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: AI Long-Term Memories */
            <div className="space-y-5">
              {/* Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/70 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-brand-950">
                  <p className="font-semibold">How AI Long-Term Memory works:</p>
                  <p className="text-brand-800/90 mt-0.5 leading-relaxed text-[11px]">
                    After each conversation, an autonomous background reflection extracts key insights about your weaknesses,
                    strengths, and preferences. The AI references these in future sessions to give personalized hints.
                  </p>
                </div>
              </div>

              {/* Add Custom Memory Input */}
              <form onSubmit={handleAddMemory} className="p-3 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3 h-3 text-brand-500" /> Add Custom Note for AI
                  </span>
                  <select
                    value={newMemoryCategory}
                    onChange={(e) => setNewMemoryCategory(e.target.value as MemoryCategory)}
                    className="text-[11px] font-medium bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:border-brand-500"
                  >
                    <option value="WEAKNESS">Weakness / Blindspot</option>
                    <option value="STRENGTH">Strength / Mastered</option>
                    <option value="LEARNING_STYLE">Learning Preference</option>
                    <option value="MILESTONE">Milestone</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemoryText}
                    onChange={(e) => setNewMemoryText(e.target.value)}
                    placeholder="e.g. Always remind me to check for integer overflow, or explain recursion visually..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={isAddingMemory || !newMemoryText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isAddingMemory ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Add
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Category Filter Pills & Clear All */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['ALL', 'WEAKNESS', 'STRENGTH', 'LEARNING_STYLE', 'MILESTONE'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all duration-150 ${
                        filterCategory === cat
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {memories.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllMemories}
                    disabled={isClearingAll}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {isClearingAll ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Clear All
                  </button>
                )}
              </div>

              {/* Memory Cards List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredMemories.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500">No memories recorded yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Chat with the tutor or add custom notes above to build your memory bank.
                    </p>
                  </div>
                ) : (
                  filteredMemories.map((mem) => {
                    const meta = CATEGORY_META[mem.category] || CATEGORY_META.LEARNING_STYLE;
                    return (
                      <div
                        key={mem.id}
                        className={`p-3 rounded-2xl border transition-all duration-150 flex items-start justify-between gap-3 ${meta.border} ${meta.bg}`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.badge}`}
                            >
                              {meta.icon}
                              {meta.label}
                            </span>

                            {mem.sourceProblem && (
                              <span className="text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                                Problem: {mem.sourceProblem}
                              </span>
                            )}

                            <span className="text-[10px] text-gray-400 ml-auto">
                              {new Date(mem.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-xs text-gray-800 leading-relaxed font-normal pt-0.5">
                            {mem.content}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMemory(mem.id)}
                          disabled={deletingId === mem.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-white transition-colors flex-shrink-0"
                          title="Delete memory"
                        >
                          {deletingId === mem.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AI Long-Term Memory Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
