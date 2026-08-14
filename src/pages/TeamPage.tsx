import React, { useState, useMemo } from 'react';
import {
  Users,
  Trash2,
  Mail,
  UserPlus,
  Edit2,
  Search,
  CheckCircle2,
  Shield,
  Lock,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { TeamMember, UserRole } from '../types';
import { normalizeRole } from '../lib/permissions';

export const TeamPage: React.FC = () => {
  const { teamMembers, tasks, addTeamMember, updateTeamMember, deleteTeamMember } = useData();
  const { userRole, canManageTeam, canAccessTeamPage } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Admin' | 'Product Manager' | 'Employee'>('ALL');

  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
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

      const normMemberRole = normalizeRole(m.role);
      const matchesRole = roleFilter === 'ALL' || normMemberRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchQuery, roleFilter]);

  const openAddModal = () => {
    if (!canManageTeam) return;
    setEditingMember(null);
    setName('');
    setRole('Employee');
    setEmail('');
    setColor('#06B6D4');
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    if (!canManageTeam) return;
    setEditingMember(member);
    setName(member.name);
    setRole(normalizeRole(member.role));
    setEmail(member.email);
    setColor(member.color || '#06B6D4');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeam) return;
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
    if (!canManageTeam) return;
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

  // Restricted Access View for Employees
  if (!canAccessTeamPage) {
    return (
      <div className="p-8 w-full max-w-2xl mx-auto my-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Team Member & Role Settings are restricted to workspace <strong>Admins</strong> and <strong>Product Managers</strong>. If you require role adjustments or member additions, please contact your workspace administrator.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200">
            <span>Your Current Role:</span>
            <span className="font-extrabold text-emerald-700 uppercase tracking-wider text-[10px]">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full space-y-5">
      {/* Read-Only Notice Banner for Product Manager */}
      {!canManageTeam && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Read-Only Access:</strong> As a Product Manager, you can view team allocations and roles. Contact an Admin to add, edit, or remove members.
            </span>
          </div>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px] uppercase tracking-wider flex-shrink-0">
            Product Manager Mode
          </span>
        </div>
      )}

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
              Manage member authorization, workspace roles (Admin, Product Manager, Employee), and OAuth access.
            </p>
          </div>

          {canManageTeam && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          )}
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
            {(['ALL', 'Admin', 'Product Manager', 'Employee'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg transition ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r === 'ALL' ? 'All' : r}
              </button>
            ))}
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
                {canManageTeam && <th className="py-3 px-6 text-right">Actions</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={canManageTeam ? 6 : 5} className="py-8 text-center text-slate-400 italic">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const activeTasks = memberTaskCount[member.id] || 0;
                  const normRole = normalizeRole(member.role);
                  const isAdmin = normRole === 'Admin';
                  const isPM = normRole === 'Product Manager';

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
                              : isPM
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{normRole}</span>
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
                      {canManageTeam && (
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
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form for Add/Edit Member */}
      {isModalOpen && canManageTeam && (
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
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                >
                  <option value="Employee">Employee</option>
                  <option value="Product Manager">Product Manager</option>
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
