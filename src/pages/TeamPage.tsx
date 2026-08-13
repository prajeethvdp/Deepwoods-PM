import React, { useState, useMemo } from 'react';
import {
  Plus,
  Users,
  Trash2,
  Mail,
  Shield,
  CheckCircle2,
  UserPlus,
  Edit2,
  Search,
  CheckSquare,
  Clock,
  Briefcase,
  Sparkles,
  LayoutGrid,
  List,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { TeamMember } from '../types';

export const TeamPage: React.FC = () => {
  const { teamMembers, tasks, addTeamMember, updateTeamMember, deleteTeamMember } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Admin' | 'Member'>('ALL');

  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Member'>('Member');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState('#06B6D4');

  // Compute workload per member
  const memberWorkload = useMemo(() => {
    const map: Record<string, { total: number; active: number; completed: number; overdue: number }> = {};
    const todayStr = new Date().toISOString().split('T')[0];

    teamMembers.forEach((m) => {
      map[m.id] = { total: 0, active: 0, completed: 0, overdue: 0 };
    });

    tasks.forEach((t) => {
      if (t.assigneeId && map[t.assigneeId]) {
        map[t.assigneeId].total += 1;
        if (t.status === 'Done') {
          map[t.assigneeId].completed += 1;
        } else {
          map[t.assigneeId].active += 1;
          if (t.dueDate && t.dueDate < todayStr) {
            map[t.assigneeId].overdue += 1;
          }
        }
      }
    });

    return map;
  }, [teamMembers, tasks]);

  // Overall Stats
  const totalMembers = teamMembers.length;
  const adminCount = teamMembers.filter((m) => m.role === 'Admin').length;
  const totalAssignedTasks = tasks.filter((t) => t.assigneeId).length;
  const totalActiveAssigned = tasks.filter((t) => t.assigneeId && t.status !== 'Done').length;

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchQuery, roleFilter]);

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setRole('Member');
    setEmail('');
    setColor('#06B6D4');
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setRole((member.role as 'Admin' | 'Member') || 'Member');
    setEmail(member.email);
    setColor(member.color || '#06B6D4');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (editingMember) {
      await updateTeamMember(editingMember.id, {
        name: name.trim(),
        role,
        email: email.trim().toLowerCase(),
        color,
      });
    } else {
      await addTeamMember({
        name: name.trim(),
        role,
        email: email.trim().toLowerCase(),
        color,
        active: true,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (member: TeamMember) => {
    if (confirm(`Are you sure you want to remove ${member.name} (${member.email}) from the team?`)) {
      await deleteTeamMember(member.id);
    }
  };

  const PRESET_COLORS = [
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#64748B', // Slate
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Title Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Background decorative blur shapes */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Workspace Access & Permission Control</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Team Management
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Manage pre-approved Google OAuth members, assign roles, inspect real-time workload metrics, and configure workspace permissions.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Team Members</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalMembers}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> All OAuth Authorized
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Admins vs Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Role Distribution</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {adminCount} <span className="text-xs font-bold text-slate-400">Admin</span> / {totalMembers - adminCount} <span className="text-xs font-bold text-slate-400">Member</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Workspace Role Governance
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Shield className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Active Assigned Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Active Task Workload</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalActiveAssigned}</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {totalAssignedTasks} total tasks
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Briefcase className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Domain Access Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Google OAuth Security</p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">Single Sign-On</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Pre-approved whitelist
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckSquare className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Role Filter & View Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Right: Role Filter & Layout Toggle */}
        <div className="flex items-center gap-3">
          {/* Role Filter buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              All ({totalMembers})
            </button>
            <button
              onClick={() => setRoleFilter('Admin')}
              className={`px-3 py-1 rounded-lg transition ${
                roleFilter === 'Admin' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Admins ({adminCount})
            </button>
            <button
              onClick={() => setRoleFilter('Member')}
              className={`px-3 py-1 rounded-lg transition ${
                roleFilter === 'Member' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Members ({totalMembers - adminCount})
            </button>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No team members found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or role filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: Responsive Modern Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const workload = memberWorkload[member.id] || { total: 0, active: 0, completed: 0, overdue: 0 };
            const isAdmin = member.role === 'Admin';

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent top color border line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: member.color || '#06B6D4' }}
                />

                <div className="space-y-4 pt-1">
                  {/* Top row: Avatar + Name + Role Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl text-white text-sm font-extrabold flex items-center justify-center shadow-xs flex-shrink-0"
                        style={{ backgroundColor: member.color || '#06B6D4' }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-cyan-700 transition">
                          {member.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          ID: {member.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border flex-shrink-0 ${
                        isAdmin
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {member.role || 'Member'}
                    </span>
                  </div>

                  {/* Email & Status */}
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a
                        href={`mailto:${member.email}`}
                        className="font-medium hover:text-cyan-600 transition truncate"
                      >
                        {member.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                      <span className="text-slate-400">OAuth Access:</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active Whitelist
                      </span>
                    </div>
                  </div>

                  {/* Workload Stats Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Assigned Workload</span>
                      <span className="text-slate-900 font-extrabold">
                        {workload.active} active task{workload.active === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Miniature Stat Badges */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                      <div className="bg-cyan-50/60 border border-cyan-100 rounded-lg py-1 text-cyan-800">
                        {workload.total} Total
                      </div>
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg py-1 text-emerald-800">
                        {workload.completed} Done
                      </div>
                      <div className={`rounded-lg py-1 border ${
                        workload.overdue > 0
                          ? 'bg-red-50 text-red-700 border-red-200 font-black animate-pulse'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {workload.overdue} Overdue
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => openEditModal(member)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl transition border border-slate-200/80 hover:border-cyan-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-slate-200/80 hover:border-red-200"
                    title="Remove Team Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW: Sleek Data Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Team Member</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Authorized Email</th>
                  <th className="px-6 py-3.5">Assigned Workload</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMembers.map((member) => {
                  const workload = memberWorkload[member.id] || { total: 0, active: 0, completed: 0, overdue: 0 };
                  const isAdmin = member.role === 'Admin';

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl text-white text-xs font-extrabold flex items-center justify-center shadow-2xs flex-shrink-0"
                            style={{ backgroundColor: member.color || '#06B6D4' }}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {member.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            isAdmin
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {member.role || 'Member'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-xs">{member.email}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {workload.active} active
                          </span>
                          <span className="text-[10px] text-slate-400">({workload.total} total)</span>
                          {workload.overdue > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-extrabold">
                              {workload.overdue} overdue
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Active Access
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Member"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form for Add/Edit Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                {editingMember ? 'Edit Team Member' : 'Add Pre-approved Member'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Workspace Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'Admin' | 'Member')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                >
                  <option value="Member">Member (Standard Task Access)</option>
                  <option value="Admin">Admin (Full Workspace Management)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Google OAuth Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@deepwoods.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Only users logging in with this exact email will be authorized.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Assignee Theme Color</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition transform ${
                        color === c ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer ml-1"
                    title="Custom Color Picker"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
