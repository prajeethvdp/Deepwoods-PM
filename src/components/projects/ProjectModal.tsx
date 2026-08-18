import React, { useState } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose }) => {
  const { createProject } = useData();
  const { canManageProjects } = useAuth();

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#06B6D4');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageProjects) {
      alert('Only Admins and Product Managers can create new projects.');
      return;
    }
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await createProject({
        name: name.trim(),
        clientName: clientName.trim() || 'Internal Client',
        description: description.trim(),
        color,
        startDate,
        endDate,
        status: 'Active',
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight font-serif">Create Project</h3>
              <p className="text-xs text-slate-500">Track tasks under a new sustainability project</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Color Badge</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color.startsWith('#') ? color : `#${color}`}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
              />
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-slate-400 font-mono text-xs font-bold">#</span>
                <input
                  type="text"
                  value={color.replace(/^#/, '')}
                  onChange={(e) => {
                    const val = e.target.value.trim().replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                    setColor(`#${val}`);
                  }}
                  placeholder="EA580C"
                  maxLength={6}
                  className="w-28 bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-slate-800 uppercase focus:bg-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope of work, key deliverables..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-600 text-white font-semibold rounded-xl"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Save Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
