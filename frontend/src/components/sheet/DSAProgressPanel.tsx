'use client';

import React from 'react';
import type { ProgressStats } from '@/hooks/useProgress';

interface DSAProgressPanelProps {
  stats: ProgressStats;
}

/** Radial SVG ring component */
function RadialRing({
  value,
  max,
  size = 110,
  strokeWidth = 9,
  color = '#f97316',
  trackColor = '#f3f4f6',
  label,
  sublabel,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label: React.ReactNode;
  sublabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={center} cy={center} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-gray-900 leading-none">{value}</span>
        {sublabel && <span className="text-[10px] text-gray-400 mt-0.5 font-medium">{sublabel}</span>}
      </div>
    </div>
  );
}

/** Mini stat row for Easy / Medium / Hard */
function DiffStatRow({
  label,
  solved,
  total,
  color,
  dotColor,
}: {
  label: string;
  solved: number;
  total: number;
  color: string;
  dotColor: string;
}) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className="text-xs text-gray-600 w-14 flex-shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-800 flex-shrink-0 w-14 text-right">
        {solved}<span className="text-gray-400 font-normal">/{total}</span>
      </span>
    </div>
  );
}

/**
 * DSAProgressPanel — right sidebar with progress ring + Easy/Med/Hard stats.
 * Crisp white cards with orange accent branding.
 */
export function DSAProgressPanel({ stats }: DSAProgressPanelProps) {
  const overallPct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3.5 h-full overflow-y-auto scrollbar-thin px-1">
      {/* ── Overall Progress Ring ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-3.5 shadow-xs">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">DSA Progress</span>
          <span className="text-xs font-bold text-brand-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
            {overallPct}%
          </span>
        </div>

        <RadialRing
          value={stats.solved}
          max={stats.total}
          size={116}
          strokeWidth={9}
          color="#f97316"
          trackColor="#f3f4f6"
          label={stats.solved}
          sublabel={`/ ${stats.total}`}
        />

        <div className="w-full space-y-2">
          <DiffStatRow
            label="Easy"
            solved={stats.byDifficulty.easy.solved}
            total={stats.byDifficulty.easy.total}
            color="bg-emerald-500"
            dotColor="bg-emerald-500"
          />
          <DiffStatRow
            label="Medium"
            solved={stats.byDifficulty.medium.solved}
            total={stats.byDifficulty.medium.total}
            color="bg-amber-500"
            dotColor="bg-amber-500"
          />
          <DiffStatRow
            label="Hard"
            solved={stats.byDifficulty.hard.solved}
            total={stats.byDifficulty.hard.total}
            color="bg-red-500"
            dotColor="bg-red-500"
          />
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center shadow-xs">
          <div className="text-xl font-extrabold text-emerald-800">{stats.solved}</div>
          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">Solved</div>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-center shadow-xs">
          <div className="text-xl font-extrabold text-amber-800">{stats.revision}</div>
          <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mt-0.5">Revision</div>
        </div>
      </div>

      {/* ── Motivational streak card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">🔥</span>
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Keep Going!</span>
        </div>
        {stats.total > 0 ? (
          <p className="text-xs text-gray-600 leading-relaxed">
            {stats.solved === 0
              ? "Start solving problems to build momentum. Consistency is your superpower!"
              : stats.solved < stats.total * 0.25
              ? `You've solved ${stats.solved} problems. Great start — keep pushing!`
              : stats.solved < stats.total * 0.5
              ? `${stats.solved} problems done! You're making solid progress.`
              : stats.solved < stats.total * 0.75
              ? `More than halfway there! ${stats.total - stats.solved} problems left to go.`
              : stats.solved < stats.total
              ? `Almost done! Just ${stats.total - stats.solved} problems remaining. Finish strong!`
              : `🎉 Sheet completed! You've solved all ${stats.total} problems. Outstanding!`}
          </p>
        ) : (
          <p className="text-xs text-gray-400">Loading problem list...</p>
        )}
      </div>

      {/* ── Remaining count ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Remaining</div>
        <div className="flex items-end gap-1">
          <span className="text-2xl font-extrabold text-gray-900">{Math.max(0, stats.total - stats.solved)}</span>
          <span className="text-xs text-gray-500 mb-0.5">/ {stats.total}</span>
        </div>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
