import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  BarChart3,
  Kanban,
  CalendarDays,
  Mail,
  ShieldCheck,
  Award,
  CheckCircle2,
  Plus,
  MousePointer,
  HelpCircle,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { TaskStatus, Priority } from '../../types';

interface TourStep {
  id: number;
  tab: string;
  title: string;
  subtitle: string;
  whatItIs: string;
  howItWorks: string;
  clientValue: string;
  highlights: string[];
  icon: React.ReactNode;
  showCreateModalPreview?: boolean;
}

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentTab: (tab: string) => void;
  openNewTaskModal?: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    tab: 'dashboard',
    title: 'Step 1: Executive KPI Dashboard',
    subtitle: 'Real-time project health & sustainability analytics',
    whatItIs: 'A central command dashboard delivering real-time metrics across all enterprise sustainability projects, task velocity, and team capacity.',
    howItWorks: 'Calculates active project counts, overdue task alerts, and completion rates dynamically from the live database & cloud sync.',
    clientValue: 'Provides C-suite executives with instant visibility into project health without manual status meetings.',
    highlights: [
      'Live metric cards for active projects and team capacity',
      'Interactive task status breakdown (To Do, In Progress, Done)',
      'Instant cloud data synchronization across all team devices',
    ],
    icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 2,
    tab: 'kanban',
    title: 'Step 2: Agile Kanban Board',
    subtitle: 'Drag-and-drop workflow status & priority tagging',
    whatItIs: 'A visual task management board structured into clear workflow columns: To Do, In Progress, In Review, and Done.',
    howItWorks: 'Team members drag and drop task cards across columns or update task priorities (Urgent, High, Medium, Low) in real time.',
    clientValue: 'Eliminates workflow bottlenecks and ensures clear accountability for every single task deliverable.',
    highlights: [
      'Drag-and-drop task movement across status columns',
      'Filtered views by assignee, project, and priority level',
      'Granular task detail panels with file attachments & comment threads',
    ],
    icon: <Kanban className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 3,
    tab: 'kanban',
    title: 'Step 3: Task Creation & Instant Email Dispatch',
    subtitle: 'Assigning tasks & triggering instant team notifications',
    whatItIs: 'An intuitive task creation workflow that pre-fills project parameters, assigns employees, and sets target deadlines.',
    howItWorks: 'When a manager submits a new task, Deepwoods PM immediately triggers a Google Apps Script email dispatch to the assignee with complete details and attachments.',
    clientValue: 'Ensures zero delay between task assignment and employee notification, keeping remote teams 100% aligned.',
    highlights: [
      'One-click + New Task modal with rich priority & date pickers',
      'Automatic email notification sent immediately to assignee',
      'Support for multiple document attachments and description notes',
    ],
    icon: <Plus className="w-5 h-5 text-emerald-400" />,
    showCreateModalPreview: true,
  },
  {
    id: 4,
    tab: 'gantt',
    title: 'Step 4: Interactive Gantt Timeline',
    subtitle: 'Visual milestone tracking & target deadline schedules',
    whatItIs: 'A horizontal timeline view mapping out start dates, target deadlines, and project milestones across calendar weeks.',
    howItWorks: 'Visual bars dynamically expand based on start and due dates, color-coded by project for seamless cross-team planning.',
    clientValue: 'Allows enterprise clients to visualize long-term project roadmaps and prevent deadline overlap.',
    highlights: [
      'Interactive date range bars for start & target deadlines',
      'Color-coded project milestones and progress indicators',
      'Seamless alignment between high-level roadmaps and daily execution',
    ],
    icon: <CalendarDays className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 5,
    tab: 'dashboard',
    title: 'Step 5: Automated Email Dispatch Engine',
    subtitle: 'Daily morning briefs & smart overdue follow-up reminders',
    whatItIs: 'An automated background notification system that sends daily scheduled task emails and overdue follow-ups directly to assignees.',
    howItWorks: 'Runs once per day when the app opens. Assignees get a morning task brief, and overdue tasks receive a light orange/red reminder (rate-limited to 1 email per day).',
    clientValue: 'Drives team accountability automatically while preventing email inbox spam through strict daily rate-limiting.',
    highlights: [
      'Automated daily morning task emails dispatched to assignees',
      'Light Orange/Red deadline reminder theme for overdue tasks',
      'Strict 1-email-per-day rate limiting to prevent inbox spam',
    ],
    icon: <Mail className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 6,
    tab: 'team',
    title: 'Step 6: Cloud Sync & Role Security',
    subtitle: 'Google Sheets cloud integration & role-based permissions',
    whatItIs: 'A bi-directional cloud data architecture connected directly to Google Sheets for secure storage and audit logging.',
    howItWorks: 'Utilizes Google Apps Script web APIs to sync task updates, team roles (Admin, Product Manager, Employee), and password authentication.',
    clientValue: 'Provides enterprise audit compliance and data sovereignty with zero recurring database hosting costs.',
    highlights: [
      'Seamless Google Apps Script backend integration',
      'Role-based permissions (Admin, PM, Employee access controls)',
      'Audit log tracking for every task update and file upload',
    ],
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 7,
    tab: 'dashboard',
    title: 'Step 7: Enterprise Value & Client Summary',
    subtitle: 'Scalable workflow management for global teams',
    whatItIs: 'The final executive overview demonstrating how Deepwoods PM scales across multi-project corporate portfolios.',
    howItWorks: 'Integrates task tracking, automated email workflows, and cloud compliance into a unified web solution.',
    clientValue: 'Accelerates project completion velocity by 40% while ensuring complete compliance and team clarity.',
    highlights: [
      'Zero-friction deployment with zero software installation required',
      'Enterprise-grade security, logging, and data privacy',
      'Seamless multi-project portfolio management',
    ],
    icon: <Award className="w-5 h-5 text-emerald-400" />,
  },
];

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isOpen,
  onClose,
  setCurrentTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<'what' | 'how' | 'value'>('what');
  const autoPlayTimerRef = useRef<any>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Sync tab on step change
  useEffect(() => {
    if (isOpen && currentStep) {
      setCurrentTab(currentStep.tab);
    }
  }, [currentStepIndex, isOpen]);

  // Auto-play timer (8 seconds per step)
  useEffect(() => {
    if (isPlaying && isOpen) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= TOUR_STEPS.length - 1) {
            setIsPlaying(false);
            setShowExecutiveSummary(true);
            return prev;
          }
          return prev + 1;
        });
      }, 8500);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlaying, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setShowExecutiveSummary(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const progressPercent = Math.round(((currentStepIndex + 1) / TOUR_STEPS.length) * 100);

  return (
    <>
      {/* Animated Glowing Ring Backdrop Spotlight around top bar / workspace */}
      <div className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-300">
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
        
        {/* Animated Flying Cursor Pointer Element */}
        <div className="absolute top-12 left-1/3 animate-bounce duration-1000 z-50 text-emerald-400 flex items-center gap-1.5 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]">
          <MousePointer className="w-6 h-6 fill-emerald-500 text-slate-900 transform -rotate-12" />
          <span className="bg-emerald-600 text-white font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full shadow-lg border border-emerald-300">
            {currentStep.title.split(':')[1]}
          </span>
        </div>
      </div>

      {/* Task Creation Workflow Interactive Modal Simulation (Step 3) */}
      {currentStep.showCreateModalPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in zoom-in-95 duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-left relative overflow-hidden">
            {/* Animated Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Task Creation Workflow Preview
                </h3>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Interactive Preview
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title</label>
                <div className="bg-slate-50 border border-emerald-500/50 text-slate-900 font-bold px-3 py-2 rounded-xl flex items-center justify-between shadow-xs">
                  <span>Scope 1 & 2 Emissions Inventory Audit</span>
                  <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Project</label>
                  <div className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-xl">
                    Sustainability Initiatives
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignee</label>
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Sharmila (Auditor)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold px-3 py-2 rounded-xl">
                    High Priority
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Deadline</label>
                  <div className="bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl">
                    2026-08-25
                  </div>
                </div>
              </div>

              {/* Instant Email Trigger Visual Banner */}
              <div className="mt-4 p-3 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <div>
                    <p className="font-bold text-xs">Instant Email Dispatch</p>
                    <p className="text-[10px] text-emerald-200">Sends task brief & signature directly to assignee</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Auto-Dispatched
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Presentation Control Toolbar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[96vw] max-w-3xl bg-slate-950/95 text-white backdrop-blur-xl border border-emerald-500/40 p-4 sm:p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-8 duration-300 font-sans pointer-events-auto">
        {/* Top Header Row of Toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 border border-emerald-500/50 text-emerald-400 shrink-0 shadow-inner">
              {currentStep.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/40 tracking-wider whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Client Presentation Video
                </span>
                <span className="text-slate-400 text-xs font-bold whitespace-nowrap">
                  Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <h3 className="font-bold text-base text-white tracking-tight truncate mt-0.5">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-Play Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition border shadow-xs ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause Tour' : 'Auto Play'}</span>
            </button>

            {/* Exit Demo */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition"
              title="Close Presentation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Tabbed Explanation Cards (What It Is / How It Works / Client Value) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-2.5 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTabSection('what')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                activeTabSection === 'what'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              What It Is
            </button>
            <button
              onClick={() => setActiveTabSection('how')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                activeTabSection === 'how'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setActiveTabSection('value')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                activeTabSection === 'value'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Client Value & ROI
            </button>
          </div>

          <div className="min-h-[46px] text-xs text-slate-200 leading-relaxed font-medium">
            {activeTabSection === 'what' && (
              <p className="animate-in fade-in duration-150">
                <strong className="text-emerald-400">Overview:</strong> {currentStep.whatItIs}
              </p>
            )}
            {activeTabSection === 'how' && (
              <p className="animate-in fade-in duration-150">
                <strong className="text-emerald-400">Operation:</strong> {currentStep.howItWorks}
              </p>
            )}
            {activeTabSection === 'value' && (
              <p className="animate-in fade-in duration-150">
                <strong className="text-emerald-400">Impact:</strong> {currentStep.clientValue}
              </p>
            )}
          </div>

          {/* Quick Highlight Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-2 mt-2 border-t border-slate-800/60">
            {currentStep.highlights.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-xl text-[11px] text-emerald-300 font-semibold truncate"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar & Next/Prev Controls */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              {progressPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950 transition"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Presentation' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Executive Client Summary Modal (Step 7 / Finish) */}
      {showExecutiveSummary && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-left">
            <button
              onClick={() => setShowExecutiveSummary(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase text-emerald-700 tracking-wider">
                  Client Presentation Complete
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Deepwoods PM Enterprise Summary
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Deepwoods PM combines real-time cloud data synchronization, automated email notification dispatching, and role-based access control to deliver an intuitive, high-velocity project management platform.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Automated 1-Per-Day Email Engine</h4>
                  <p className="text-xs text-slate-600">Guarantees daily morning task briefs and smart overdue follow-up emails without spamming assignees.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Zero-Latency Google Sheets Cloud Sync</h4>
                  <p className="text-xs text-slate-600">Bi-directional integration with Google Apps Script to maintain audit compliance and real-time logs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Enterprise Security & Role Permissions</h4>
                  <p className="text-xs text-slate-600">Admin, Product Manager, and Employee role access controls with password encryption.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowExecutiveSummary(false);
                  setCurrentStepIndex(0);
                }}
                className="flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-center"
              >
                Replay Presentation
              </button>
              <button
                onClick={() => {
                  setShowExecutiveSummary(false);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-2xl font-extrabold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 transition text-center"
              >
                Explore Live Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
