import React, { useState, useMemo } from 'react';
import {
  Plus,
  Users,
  Trash2,
  Mail,
  UserPlus,
  Edit2,
  Search,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { TeamMember } from '../types';

export const TeamPage: React.FC = () => {
  const { teamMembers, tasks, addTeamMember, updateTeamMember, deleteTeamMember } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Admin' | 'Member'>('ALL');

  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Member'>('Member');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState('#06B6D4');

  // Compute active tasks count per member
  const memberTaskCount = useMemo(() => {
    const map: Record<string, number> = {};
    teamMembers.forEach((m) => {
      map[m.id] = 0;
    });
    tasks.forEach((t) => {
      if (t.assigneeId && t.status !== 'Done' && map[t.assigneeId] !== undefined) {
        map[t.assigneeId] += 1;
      }
    });
    return map;
  }, [teamMembers, tasks]);

  // Filtered members
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
    if (confirm(`Remove ${member.name} from the workspace?`)) {
      await deleteTeamMember(member.id);
    }
  };

  const PRESET_COLORS = [
    '#06B6D4',
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#F59E0B',
    '#64748B',
  ];

  return (
    <div className="p-6 w-full space-y-5">
      {/* Header & Main Card Wrapper */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Team Members</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {teamMembers.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage member authorization, workspace roles, and OAuth access.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                roleFilter === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('Admin')}
              className={`px-3 py-1 rounded-lg transition ${
                roleFilter === 'Admin'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setRoleFilter('Member')}
              className={`px-3 py-1 rounded-lg transition ${
                roleFilter === 'Member'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Members
            </button>
          </div>
        </div>

        {/* Clean Enterprise Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/30 uppercase tracking-wider">
                <th className="py-3 px-6">Member</th>
                <th className="py-3 px-4">Authorized Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Active Tasks</th>
                <th className="py-3 px-4">Access Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const activeTasks = memberTaskCount[member.id] || 0;
                  const isAdmin = member.role === 'Admin';

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition group">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-2xs"
                            style={{ backgroundColor: member.color || '#06B6D4' }}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {member.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-xs">{member.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAdmin
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{member.role || 'Member'}</span>
                        </span>
                      </td>

                      {/* Active Tasks */}
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {activeTasks > 0 ? (
                          <span className="text-slate-800 font-bold">{activeTasks} active</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0 tasks</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="Edit Member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form for Add/Edit Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
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
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workspace Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'Admin' | 'Member')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Google OAuth Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Avatar Color</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition ${
                        color === c ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded border border-slate-200 cursor-pointer ml-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-xs transition"
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
