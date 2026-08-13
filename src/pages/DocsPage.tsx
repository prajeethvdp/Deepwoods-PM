import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Search,
  Save,
  Folder,
  Clock,
  User,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { DocNote } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const DOCS_STORAGE_KEY = 'deepwoods_docs';

const initialSampleDocs: DocNote[] = [
  {
    id: 'doc-1',
    title: '🌲 Deepwoods PM Architecture Guidelines',
    content: `# Deepwoods PM Architecture Guidelines

Welcome to the internal engineering guidelines for Deepwoods Green Project Management System.

## System Overview
- Frontend: React + TypeScript + Tailwind CSS
- Authentication: Dual Google OAuth 2.0 & SHA-256 Encrypted Passwords
- Backend API: Google Apps Script Web App Endpoint (Code.gs)
- Database Storage: Google Sheets (Tasks, Projects, TeamMembers, TaskComments)

## Design Principles
1. Glassmorphism Aesthetic: Rich dark themes with slate/cyan gradients.
2. Speed & Shortcut-Driven: Cmd+K / Ctrl+K Linear command palette for instant navigation.
3. Multi-View System: Board, List, Gantt, Calendar, Dashboard, and Docs.
`,
    projectId: '',
    authorId: 'tm-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DocsPage: React.FC = () => {
  const { projects } = useData();
  const { user } = useAuth();

  const [docs, setDocs] = useState<DocNote[]>(() => {
    const saved = localStorage.getItem(DOCS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialSampleDocs;
  });

  const [selectedDocId, setSelectedDocId] = useState<string>(docs[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Active doc state
  const activeDoc = docs.find((d) => d.id === selectedDocId) || docs[0] || null;
  const [editTitle, setEditTitle] = useState(activeDoc?.title || '');
  const [editContent, setEditContent] = useState(activeDoc?.content || '');
  const [editProjectId, setEditProjectId] = useState(activeDoc?.projectId || '');

  useEffect(() => {
    if (activeDoc) {
      setEditTitle(activeDoc.title);
      setEditContent(activeDoc.content);
      setEditProjectId(activeDoc.projectId || '');
    }
  }, [selectedDocId]);

  const saveDocsToStorage = (updatedDocs: DocNote[]) => {
    setDocs(updatedDocs);
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(updatedDocs));
  };

  const handleCreateDoc = () => {
    const newDoc: DocNote = {
      id: `doc-${Date.now()}`,
      title: 'Untitled Document',
      content: '# New Document\n\nStart typing notes, specifications, or meeting guidelines here...',
      projectId: selectedProjectId !== 'ALL' ? selectedProjectId : '',
      authorId: user?.id || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newDoc, ...docs];
    saveDocsToStorage(updated);
    setSelectedDocId(newDoc.id);
  };

  const handleSaveDoc = () => {
    if (!activeDoc) return;
    const updated = docs.map((d) =>
      d.id === activeDoc.id
        ? {
            ...d,
            title: editTitle.trim() || 'Untitled Document',
            content: editContent,
            projectId: editProjectId,
            updatedAt: new Date().toISOString(),
          }
        : d
    );
    saveDocsToStorage(updated);
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      const updated = docs.filter((d) => d.id !== id);
      saveDocsToStorage(updated);
      if (selectedDocId === id) {
        setSelectedDocId(updated[0]?.id || '');
      }
    }
  };

  // Filtering
  const filteredDocs = docs.filter((d) => {
    const matchesProject = selectedProjectId === 'ALL' || d.projectId === selectedProjectId;
    const matchesQuery =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesQuery;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Sidebar: Document List */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/70 flex flex-col h-full flex-shrink-0">
        {/* Header & Controls */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-sm text-white">Project Docs & Notes</h2>
            </div>
            <button
              onClick={handleCreateDoc}
              className="p-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1 transition"
              title="Create New Document"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Projects Docs</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Doc List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDocs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No docs found matching filters. Click "+ New" to create one.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              const proj = projects.find((p) => p.id === doc.projectId);
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`group w-full p-3 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-l-2 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs font-semibold truncate flex items-center gap-2">
                      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="truncate">{doc.title || 'Untitled Document'}</span>
                    </div>
                    {proj && (
                      <span
                        className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${proj.color}20`, color: proj.color }}
                      >
                        {proj.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDoc(doc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Document Editor */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {activeDoc ? (
          <>
            {/* Editor Header Bar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveDoc}
                  placeholder="Document Title..."
                  className="bg-transparent text-lg font-bold text-white focus:outline-none focus:border-b border-cyan-500 w-full"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={editProjectId}
                  onChange={(e) => {
                    setEditProjectId(e.target.value);
                    setTimeout(handleSaveDoc, 100);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">No Project Assigned</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSaveDoc}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Document Content Textarea */}
            <div className="flex-1 p-6 overflow-y-auto">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleSaveDoc}
                placeholder="Write specs, meeting notes, requirements, or markdown content..."
                className="w-full h-full bg-transparent text-slate-200 text-sm font-mono leading-relaxed focus:outline-none resize-none"
              />
            </div>

            {/* Status Footer */}
            <div className="px-6 py-2 border-t border-slate-900 bg-slate-950 text-[11px] text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Updated {new Date(activeDoc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-400" />
                  Author ID: {activeDoc.authorId}
                </span>
              </div>
              <span className="text-cyan-400 font-mono text-[10px]">Notion-Style Wiki Editor</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 space-y-3">
            <FileText className="w-12 h-12 text-slate-700" />
            <p className="text-sm font-medium">Select a document or create a new one to begin editing.</p>
            <button
              onClick={handleCreateDoc}
              className="bg-cyan-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-cyan-500"
            >
              + Create New Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
