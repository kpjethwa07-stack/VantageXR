import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  X,
  Zap,
  Eye,
  Clock,
  Target,
} from 'lucide-react';
import { AdjudicationResult } from '../services/gemini';

interface AnalyticsDashboardProps {
  history: AdjudicationResult[];
  isOpen: boolean;
  onClose: () => void;
}

function AnimatedCounter({ target, duration = 1500, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  
  return <span>{count}{suffix}</span>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ history, isOpen, onClose }) => {
  if (!isOpen) return null;

  const totalAudits = history.length;
  const criticalCount = history.filter(h => h.risk_level === 'Critical').length;
  const highCount = history.filter(h => h.risk_level === 'High').length;
  const mediumCount = history.filter(h => h.risk_level === 'Medium').length;
  const lowCount = history.filter(h => h.risk_level === 'Low').length;
  
  const passCount = history.filter(h => h.validation.consistency === 'PASS').length;
  const failCount = history.filter(h => h.validation.consistency === 'FAIL').length;
  const passRate = totalAudits > 0 ? Math.round((passCount / totalAudits) * 100) : 0;
  const fraudRate = totalAudits > 0 ? Math.round(((criticalCount + highCount) / totalAudits) * 100) : 0;

  // Severity distribution for the bar chart
  const severityData = [
    { label: 'Critical', count: criticalCount, color: 'bg-rose-500', textColor: 'text-rose-500', glowColor: 'shadow-rose-500/30' },
    { label: 'High', count: highCount, color: 'bg-orange-500', textColor: 'text-orange-500', glowColor: 'shadow-orange-500/30' },
    { label: 'Medium', count: mediumCount, color: 'bg-amber-500', textColor: 'text-amber-500', glowColor: 'shadow-amber-500/30' },
    { label: 'Low', count: lowCount, color: 'bg-emerald-500', textColor: 'text-emerald-500', glowColor: 'shadow-emerald-500/30' },
  ];

  const maxSeverity = Math.max(...severityData.map(s => s.count), 1);

  // Recent conditions detected
  const conditionFrequency: Record<string, number> = {};
  history.forEach(h => {
    if (h.targetCondition) {
      conditionFrequency[h.targetCondition] = (conditionFrequency[h.targetCondition] || 0) + 1;
    }
  });
  const topConditions = Object.entries(conditionFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-5 flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }} />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Fraud Analytics Command Center</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Real-time PMJAY claim intelligence • {totalAudits} audit{totalAudits !== 1 ? 's' : ''} processed
                </p>
              </div>
            </div>
            <button onClick={onClose} className="relative z-10 p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
            {totalAudits === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Activity className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">No Audit Data</h3>
                <p className="text-[12px] text-slate-400 font-medium">Run audits to populate the analytics dashboard.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-sky-500" />
                    <div className="flex items-center justify-between mb-3">
                      <Eye className="w-5 h-5 text-sky-500" />
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Total</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                      <AnimatedCounter target={totalAudits} />
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Claims Audited</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                    <div className="flex items-center justify-between mb-3">
                      <ShieldAlert className="w-5 h-5 text-rose-500" />
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Alert</span>
                    </div>
                    <p className="text-3xl font-black text-rose-600 tracking-tight">
                      <AnimatedCounter target={fraudRate} suffix="%" />
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">High Risk Rate</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                    <div className="flex items-center justify-between mb-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Pass</span>
                    </div>
                    <p className="text-3xl font-black text-emerald-600 tracking-tight">
                      <AnimatedCounter target={passRate} suffix="%" />
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Compliance Rate</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                    <div className="flex items-center justify-between mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Flag</span>
                    </div>
                    <p className="text-3xl font-black text-amber-600 tracking-tight">
                      <AnimatedCounter target={failCount} />
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Failed Audits</p>
                  </motion.div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Severity Distribution */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-4 h-4 text-sky-500" />
                        Severity Distribution
                      </h3>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">Real-time</span>
                    </div>
                    <div className="space-y-4">
                      {severityData.map((item, i) => (
                        <div key={item.label} className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider w-16">{item.label}</span>
                          <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / maxSeverity) * 100}%` }}
                              transition={{ duration: 1, delay: 0.6 + i * 0.15, ease: 'easeOut' }}
                              className={`h-full ${item.color} rounded-lg shadow-lg ${item.glowColor} relative flex items-center justify-end pr-3`}
                            >
                              {item.count > 0 && (
                                <span className="text-[11px] font-black text-white">{item.count}</span>
                              )}
                            </motion.div>
                          </div>
                          <span className={`text-sm font-black ${item.textColor} w-8 text-right`}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Pass/Fail Donut */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-sky-500" />
                        Audit Outcomes
                      </h3>
                    </div>
                    <div className="flex items-center justify-center gap-8">
                      {/* SVG Donut */}
                      <div className="relative w-36 h-36">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                          <motion.circle
                            cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
                            strokeDasharray={`${passRate * 2.51} ${251.2 - passRate * 2.51}`}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ duration: 1.5, delay: 0.7 }}
                          />
                          <motion.circle
                            cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12"
                            strokeDasharray={`${(100 - passRate) * 2.51} ${251.2 - (100 - passRate) * 2.51}`}
                            strokeDashoffset={-passRate * 2.51}
                            strokeLinecap="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.5 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-900"><AnimatedCounter target={passRate} suffix="%" /></span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pass rate</span>
                        </div>
                      </div>
                      {/* Legend */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
                          <div>
                            <p className="text-sm font-black text-slate-800">{passCount}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Passed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/30" />
                          <div>
                            <p className="text-sm font-black text-slate-800">{failCount}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Failed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Top Conditions */}
                {topConditions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                  >
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-5">
                      <TrendingUp className="w-4 h-4 text-sky-500" />
                      Most Flagged Conditions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {topConditions.map(([condition, count], i) => (
                        <motion.div
                          key={condition}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9 + i * 0.1 }}
                          className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all group"
                        >
                          <p className="text-2xl font-black text-slate-900 group-hover:text-sky-600 transition-colors">{count}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 truncate" title={condition}>
                            {condition}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Recent Audit Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                >
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-5">
                    <Clock className="w-4 h-4 text-sky-500" />
                    Recent Audit Activity
                  </h3>
                  <div className="space-y-3">
                    {history.slice(0, 5).map((audit, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          audit.risk_level === 'Critical' ? 'bg-rose-500 shadow-lg shadow-rose-500/40' :
                          audit.risk_level === 'High' ? 'bg-orange-500 shadow-lg shadow-orange-500/40' :
                          audit.risk_level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-[11px] font-black text-slate-700 flex-1 truncate font-mono">
                          {audit.targetCondition || 'Unknown'}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          audit.validation.consistency === 'PASS'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {audit.validation.consistency}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          audit.risk_level === 'Critical' ? 'bg-rose-50 text-rose-600' :
                          audit.risk_level === 'High' ? 'bg-orange-50 text-orange-600' :
                          audit.risk_level === 'Medium' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {audit.risk_level}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
