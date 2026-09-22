import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Settings as SettingsIcon, Bell, Shield, CheckCircle, Camera, Anchor, 
  Lock, ShieldCheck, UserCheck, UserX, Crown, Trash2, RefreshCw, 
  AlertCircle, ShieldAlert, Plus, Search, Check
} from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useUser } from '../contexts/UserContext';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer shrink-0">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-11 h-6 bg-glass peer-focus:outline-none rounded-full border border-glass-border peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-text-muted peer-checked:after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-accent peer-checked:border-accent shadow-inner" />
  </label>
);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] relative overflow-hidden ${className}`}>
    {children}
  </div>
);

const SettingRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex items-center justify-between p-4 hover:bg-glass transition-colors border-b border-glass-border last:border-b-0">
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">{label}</h4>
      <p className="text-[10px] font-mono text-text-secondary mt-1">{description}</p>
    </div>
    {children}
  </div>
);

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string | null;
}

export default function Settings() {
  const navigate = useNavigate();
  const { coordFormat, setCoordFormat } = usePreferences();
  const { profile, updateProfile } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state for profile
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);

  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
  }, [profile.fullName, profile.email]);

  // Preferences
  const [workspace, setWorkspace] = useState('Dashboard');

  // Notifications
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);
  const [notifyWeekly, setNotifyWeekly] = useState(true);

  // Security
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30 minutes');

  // Access Control / Personnel Directory State
  const [personnel, setPersonnel] = useState<ManagedUser[]>([]);
  const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(false);
  const [personnelError, setPersonnelError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Filter & Manual Authorize State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ALLOWED' | 'REVOKED'>('ALL');
  const [newGmail, setNewGmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Operator');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const isSupremeOrAdmin = 
    profile.role === 'System Administrator' || 
    profile.role === 'Admin' || 
    profile.email.toLowerCase() === 'narayan.nkj@gmail.com';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPersonnel = useCallback(async () => {
    if (!isSupremeOrAdmin) return;
    setIsLoadingPersonnel(true);
    setPersonnelError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = sessionStorage.getItem('sagar_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/auth/users`, { headers });
      if (!res.ok) {
        throw new Error('Could not fetch personnel directory');
      }
      const data: ManagedUser[] = await res.json();
      setPersonnel(data);
      
      const rolesMap: Record<string, string> = {};
      data.forEach(u => {
        rolesMap[u.id] = u.role || 'Operator';
      });
      setSelectedRoles(prev => ({ ...rolesMap, ...prev }));
    } catch (err: any) {
      setPersonnelError(err.message || 'Error loading personnel list');
    } finally {
      setIsLoadingPersonnel(false);
    }
  }, [isSupremeOrAdmin]);

  useEffect(() => {
    if (isSupremeOrAdmin) {
      fetchPersonnel();
    }
  }, [isSupremeOrAdmin, fetchPersonnel]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        updateProfile({ avatarUrl: url });
        showToast('Avatar updated successfully!');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    updateProfile({ fullName, email });
    showToast('Changes have been successfully saved!');
  };

  // Access Control Handlers
  const handleApprove = async (user: ManagedUser) => {
    setActionInProgress(user.id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = sessionStorage.getItem('sagar_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const assignedRole = selectedRoles[user.id] || user.role || 'Operator';
      
      if (assignedRole !== user.role) {
        await fetch(`${API_URL}/auth/users/${user.id}/role`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ role: assignedRole })
        });
      }

      const res = await fetch(`${API_URL}/auth/users/${user.id}/approve`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Approval failed');
      }

      showToast(`Access ALLOWED for ${user.email} (${assignedRole})`);
      await fetchPersonnel();
    } catch (err: any) {
      showToast(err.message || 'Failed to grant access');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRevoke = async (user: ManagedUser) => {
    if (user.email.toLowerCase() === 'narayan.nkj@gmail.com') {
      showToast('System Administrator access cannot be revoked.');
      return;
    }

    setActionInProgress(user.id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = sessionStorage.getItem('sagar_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/auth/users/${user.id}/revoke`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Revocation failed');
      }

      showToast(`Access REVOKED for ${user.email}`);
      await fetchPersonnel();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke access');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: string) => {
    setSelectedRoles(prev => ({ ...prev, [userId]: targetRole }));
    
    const targetUser = personnel.find(u => u.id === userId);
    if (targetUser && targetUser.is_approved) {
      setActionInProgress(userId);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const token = sessionStorage.getItem('sagar_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/auth/users/${userId}/role`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ role: targetRole })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Role update failed');
        }

        showToast(`Role updated to ${targetRole} for ${targetUser.email}`);
        await fetchPersonnel();
      } catch (err: any) {
        showToast(err.message || 'Failed to update role');
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const handleReject = async (user: ManagedUser) => {
    if (!window.confirm(`Are you sure you want to completely remove ${user.email}?`)) {
      return;
    }

    setActionInProgress(user.id);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = sessionStorage.getItem('sagar_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/auth/users/${user.id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Delete failed');
      }

      showToast(`Account for ${user.email} removed.`);
      await fetchPersonnel();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove user');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleManualAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGmail.trim()) return;

    if (!newGmail.toLowerCase().endsWith('@gmail.com') && !newGmail.toLowerCase().endsWith('@sagar.gov.in')) {
      showToast('Please enter a valid @gmail.com or @sagar.gov.in address');
      return;
    }

    setIsAuthorizing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = sessionStorage.getItem('sagar_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/auth/users/authorize-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: newGmail.trim(),
          fullName: newName.trim() || undefined,
          role: newRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authorization failed');
      }

      showToast(`Access granted for ${newGmail.trim()}`);
      setNewGmail('');
      setNewName('');
      await fetchPersonnel();
    } catch (err: any) {
      showToast(err.message || 'Failed to authorize email');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const pendingUsers = personnel.filter(u => !u.is_approved);
  const activeUsers = personnel.filter(u => u.is_approved);

  const filteredPersonnel = personnel.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'ALLOWED') return u.is_approved;
    if (statusFilter === 'REVOKED') return !u.is_approved;
    return true;
  });

  const TABS = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    ...(isSupremeOrAdmin ? [{ 
      id: 'access', 
      label: 'Access Control', 
      icon: ShieldCheck, 
      badge: pendingUsers.length > 0 ? pendingUsers.length : undefined 
    }] : []),
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  const selectClass = "bg-glass backdrop-blur-3xl rounded-xl border border-glass-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all cursor-pointer";
  const inputClass = "w-full bg-glass backdrop-blur-3xl rounded-xl border border-glass-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all placeholder-text-muted";

  // Reusable Access Control Section
  const renderAccessControlConsole = () => (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-glass-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan" />
            <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase">
              Gmail Access Control & Authorization Console
            </h3>
          </div>
          <p className="text-[10px] font-mono text-text-secondary mt-1">
            Control which Gmail accounts gain access or have access revoked across the S.A.G.A.R. platform.
          </p>
        </div>
        <button
          onClick={fetchPersonnel}
          disabled={isLoadingPersonnel}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-glass border border-glass-border hover:border-cyan text-text-secondary hover:text-cyan text-[10px] font-mono uppercase tracking-wider transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPersonnel ? 'animate-spin' : ''}`} />
          Refresh Directory
        </button>
      </div>

      {/* Supreme Authority Status Bar */}
      <div className="p-4 rounded-xl bg-cyan/5 border border-cyan/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan/15 border border-cyan/30 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan uppercase tracking-wider">System Administrator Governance</span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/40">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] font-mono text-text-muted mt-0.5">
              Logged in as <span className="text-text-primary font-bold">{profile.email}</span>. You have supreme authority to grant, alter, or revoke access for any account.
            </p>
          </div>
        </div>

        {/* Quick metrics pills */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <div className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg bg-glass border border-glass-border text-center">
            <span className="text-[8px] font-mono text-text-muted uppercase tracking-wider block">Total Gmails</span>
            <span className="text-xs font-bold font-mono text-text-primary">{personnel.length}</span>
          </div>
          <div className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
            <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-wider block">Allowed</span>
            <span className="text-xs font-bold font-mono text-emerald-400">{activeUsers.length}</span>
          </div>
          <div className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
            <span className="text-[8px] font-mono text-amber-400 uppercase tracking-wider block">Revoked/Pending</span>
            <span className="text-xs font-bold font-mono text-amber-400">{pendingUsers.length}</span>
          </div>
        </div>
      </div>

      {personnelError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{personnelError}</span>
        </div>
      )}

      {/* SECTION: PRE-AUTHORIZE / ADD GMAIL */}
      <div className="p-4 rounded-2xl bg-glass-strong border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-1 flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-cyan" /> Pre-Authorize / Grant Access to New Gmail
        </h4>
        <p className="text-[10px] font-mono text-text-secondary mb-3">
          Directly grant platform access to a Gmail address before or after they attempt signing in.
        </p>

        <form onSubmit={handleManualAuthorize} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5">
            <input
              type="email"
              placeholder="e.g. colleague@gmail.com"
              value={newGmail}
              onChange={e => setNewGmail(e.target.value)}
              required
              className="w-full bg-void/70 border border-glass-border text-text-primary text-xs font-mono rounded-xl px-3 py-2 focus:border-cyan focus:outline-none placeholder:text-text-muted"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Full Name (optional)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-void/70 border border-glass-border text-text-primary text-xs font-mono rounded-xl px-3 py-2 focus:border-cyan focus:outline-none placeholder:text-text-muted"
            />
          </div>
          <div className="sm:col-span-2">
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="w-full bg-void/70 border border-glass-border text-text-primary text-xs font-mono rounded-xl px-3 py-2 focus:border-cyan focus:outline-none cursor-pointer"
            >
              <option value="Operator">Operator</option>
              <option value="Analyst">Analyst</option>
              <option value="Senior Analyst">Senior Analyst</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isAuthorizing}
              className="w-full h-full min-h-[36px] bg-cyan/15 hover:bg-cyan/25 border border-cyan/40 text-cyan text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Allow
            </button>
          </div>
        </form>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Gmail or Name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-void/50 border border-glass-border text-text-primary text-xs font-mono rounded-xl pl-8 pr-3 py-1.5 focus:border-cyan focus:outline-none placeholder:text-text-muted"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['ALL', 'ALLOWED', 'REVOKED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-lg text-[9px] font-mono uppercase tracking-wider border transition-all ${
                statusFilter === tab
                  ? 'bg-glass-strong border-cyan text-cyan'
                  : 'bg-glass border-glass-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'ALL' ? `All (${personnel.length})` : tab === 'ALLOWED' ? `Allowed (${activeUsers.length})` : `Revoked/Pending (${pendingUsers.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* GMAIL ACCESS DIRECTORY LIST */}
      <div className="space-y-3">
        {filteredPersonnel.length === 0 ? (
          <div className="p-8 rounded-2xl bg-glass-strong border border-glass-border text-center space-y-2">
            <UserX className="w-8 h-8 text-text-muted mx-auto opacity-50" />
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider">No Matching Gmails Found</p>
            <p className="text-[10px] font-mono text-text-muted">
              {searchQuery ? 'Try adjusting your search query.' : 'No accounts have attempted to sign in yet.'}
            </p>
          </div>
        ) : (
          filteredPersonnel.map(user => {
            const isSupreme = user.email.toLowerCase() === 'narayan.nkj@gmail.com' || user.role === 'System Administrator';
            const isAllowed = user.is_approved;

            return (
              <div
                key={user.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${
                  isSupreme 
                    ? 'bg-cyan/5 border-cyan/30'
                    : isAllowed 
                      ? 'bg-glass-strong border-glass-border hover:border-emerald-500/40' 
                      : 'bg-glass-strong border-amber-500/30 hover:border-rose-500/40'
                }`}
              >
                {/* User details */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isSupreme 
                      ? 'bg-cyan/20 border-cyan/50 text-cyan'
                      : isAllowed
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  }`}>
                    {isSupreme ? <Crown className="w-5 h-5" /> : isAllowed ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                        {user.full_name || user.email.split('@')[0]}
                      </span>

                      {/* Status Badges */}
                      {isSupreme ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/40 text-[8px] font-mono font-bold flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> SUPREME ADMIN (PERMANENT)
                        </span>
                      ) : isAllowed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[8px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> ACCESS GRANTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[8px] font-mono font-bold flex items-center gap-1">
                          <ShieldAlert className="w-2.5 h-2.5" /> ACCESS REVOKED / BLOCKED
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] font-mono text-text-secondary mt-0.5">{user.email}</p>

                    {user.created_at && (
                      <p className="text-[8px] font-mono text-text-muted mt-1">
                        Recorded: {new Date(user.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role dropdown & Allow/Revoke Controls */}
                <div className="flex items-center gap-2.5 self-end md:self-center flex-wrap">
                  {isSupreme ? (
                    <span className="text-[10px] font-mono text-cyan flex items-center gap-1 px-3 py-1.5 bg-cyan/10 border border-cyan/30 rounded-xl">
                      <Crown className="w-3.5 h-3.5" /> Absolute Authority (Immune)
                    </span>
                  ) : (
                    <>
                      {/* Role selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-text-muted uppercase">Role:</span>
                        <select
                          value={selectedRoles[user.id] || user.role || 'Operator'}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          disabled={actionInProgress === user.id}
                          className="bg-void border border-glass-border text-text-primary text-[10px] font-mono rounded-lg px-2.5 py-1.5 focus:border-cyan focus:outline-none cursor-pointer"
                        >
                          <option value="Operator">Operator</option>
                          <option value="Analyst">Analyst</option>
                          <option value="Senior Analyst">Senior Analyst</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>

                      {/* Instant Allow / Revoke Button */}
                      {isAllowed ? (
                        <button
                          onClick={() => handleRevoke(user)}
                          disabled={actionInProgress === user.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(user)}
                          disabled={actionInProgress === user.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Allow Access
                        </button>
                      )}

                      {/* Purge / Delete Button */}
                      <button
                        onClick={() => handleReject(user)}
                        disabled={actionInProgress === user.id}
                        className="p-2 rounded-xl bg-void hover:bg-rose-500/10 border border-glass-border hover:border-rose-500/30 text-text-muted hover:text-rose-400 transition-all disabled:opacity-50"
                        title="Delete record from platform"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex-1 w-full flex flex-col h-full bg-void text-text-primary overflow-hidden">
      {/* ── FULL SCREEN DARK TECH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-glass-strong)_0%,_var(--color-void)_50%)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex h-full flex-col md:flex-row gap-6 max-w-6xl mx-auto p-4 md:p-6 w-full overflow-y-auto custom-scrollbar">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 bg-surface border border-accent text-text-primary px-5 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-[100] shadow-[0_0_20px_rgba(6,182,212,0.25)] rounded-xl backdrop-blur-xl">
            <CheckCircle className="w-4 h-4 text-accent shrink-0" />
            <span className="font-mono text-xs uppercase tracking-widest">{toastMessage}</span>
          </div>
        )}

        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl p-4 flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.4)] h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-glass-border">
            <div className="w-8 h-8 bg-glass-strong border border-glass-border rounded-lg flex items-center justify-center">
              <Anchor className="w-4 h-4 text-cyan" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase leading-none">Settings</h2>
              <p className="text-[9px] text-text-secondary font-mono mt-1">S.A.G.A.R. Command</p>
            </div>
          </div>
          <div className="space-y-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors text-[10px] uppercase font-bold tracking-widest border border-transparent rounded-xl ${
                  activeTab === tab.id
                    ? 'bg-glass-strong text-cyan border-glass-border shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-glass hover:backdrop-blur-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-mono font-bold animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isSupremeOrAdmin && (
            <div className="mt-6 pt-4 border-t border-glass-border">
              <div 
                onClick={() => setActiveTab('access')}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-cyan/5 border border-cyan/20 cursor-pointer hover:bg-cyan/10 transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-cyan shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-cyan">Supreme Authority</span>
                  <span className="text-[8px] font-mono text-text-muted truncate">Manage Gmail Clearances →</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Panel */}
        <GlassCard className="flex-1 p-4 md:p-6 flex flex-col h-fit">

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div className="space-y-7 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase mb-1">Profile Settings</h3>
                <p className="text-[10px] font-mono text-text-secondary">Your identity across the S.A.G.A.R. Command platform.</p>
              </div>

              {/* Avatar row */}
              <div className="flex items-center gap-6 p-5 bg-glass-strong backdrop-blur-md border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-20 h-20 bg-glass border border-glass-border rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <User className="w-8 h-8 text-text-muted" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-void/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-cyan/50">
                    <Camera className="w-5 h-5 text-cyan" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold uppercase tracking-widest text-text-primary">{profile.fullName}</p>
                    {profile.role === 'System Administrator' && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/40 text-[9px] font-mono font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" /> SUPREME ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-text-secondary mt-1">{profile.role} · {profile.email}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-glass hover:bg-glass-strong text-text-primary text-[9px] uppercase tracking-widest font-bold px-4 py-2 border border-glass-border hover:border-text-primary transition-colors rounded-xl"
                  >
                    Change Avatar
                  </button>
                  <p className="text-[9px] font-mono text-text-muted mt-2">Changes appear everywhere instantly.</p>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="Enter your name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="Enter your email" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Role</label>
                  <div className="relative">
                    <input type="text" value={profile.role} readOnly className={`${inputClass} opacity-70 cursor-not-allowed font-bold text-cyan`} />
                    {profile.role === 'System Administrator' && (
                      <Crown className="w-3.5 h-3.5 text-cyan absolute right-3 top-3 pointer-events-none" />
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Organisation</label>
                  <input type="text" defaultValue="S.A.G.A.R. Command — INS" readOnly className={`${inputClass} opacity-50 cursor-not-allowed`} />
                </div>
              </div>

              {/* Save profile button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="bg-cyan/10 hover:bg-cyan/20 text-cyan font-bold uppercase tracking-[0.2em] text-[10px] px-8 py-3 rounded-xl border border-cyan/30 hover:border-cyan transition-all shadow-[0_4px_16px_rgba(6,182,212,0.1)] hover:shadow-[0_4px_16px_rgba(6,182,212,0.2)]"
                >
                  Save Profile Changes
                </button>
              </div>

              {/* ── EMBEDDED GMAIL ACCESS CONTROL FOR SUPREME ADMIN ── */}
              {isSupremeOrAdmin && (
                <div className="pt-8 border-t border-glass-border">
                  {renderAccessControlConsole()}
                </div>
              )}
            </div>
          )}

          {/* ── ACCESS CONTROL STANDALONE TAB ── */}
          {activeTab === 'access' && isSupremeOrAdmin && (
            <div className="animate-in fade-in duration-200">
              {renderAccessControlConsole()}
            </div>
          )}

          {/* ── PREFERENCES ── */}
          {activeTab === 'preferences' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase mb-1">Preferences</h3>
                <p className="text-[10px] font-mono text-text-secondary">Customise your workspace experience.</p>
              </div>
              <div className="bg-glass-strong backdrop-blur-md border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
                <SettingRow label="Default Workspace" description="Choose which screen loads first when you log in">
                  <select value={workspace} onChange={e => setWorkspace(e.target.value)} className={selectClass}>
                    <option>Dashboard</option>
                    <option>Map Workspace</option>
                    <option>Human Review</option>
                  </select>
                </SettingRow>
                <SettingRow label="Coordinate Format" description="Display format for latitude and longitude across the platform">
                  <select value={coordFormat} onChange={e => setCoordFormat(e.target.value as 'DD' | 'DMS')} className={selectClass}>
                    <option value="DD">Decimal Degrees (DD)</option>
                    <option value="DMS">Degrees Minutes Seconds (DMS)</option>
                  </select>
                </SettingRow>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase mb-1">Notifications</h3>
                <p className="text-[10px] font-mono text-text-secondary">Control how and when you receive alerts.</p>
              </div>
              <div className="bg-glass-strong backdrop-blur-md border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
                <SettingRow label="Email Alerts" description="Receive email alerts for new high-severity anomalies">
                  <ToggleSwitch checked={notifyEmail} onChange={() => setNotifyEmail(!notifyEmail)} />
                </SettingRow>
                <SettingRow label="Push Notifications" description="Get desktop notifications for active sector updates">
                  <ToggleSwitch checked={notifyPush} onChange={() => setNotifyPush(!notifyPush)} />
                </SettingRow>
                <SettingRow label="Weekly Summary Reports" description="Receive a weekly digest of anomaly scans and metrics">
                  <ToggleSwitch checked={notifyWeekly} onChange={() => setNotifyWeekly(!notifyWeekly)} />
                </SettingRow>
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase mb-1">Security & Privacy</h3>
                <p className="text-[10px] font-mono text-text-secondary">Manage your account security settings.</p>
              </div>
              <div className="bg-glass-strong backdrop-blur-md border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
                <SettingRow label="Change Password" description="Update your account password">
                  <button className="bg-glass hover:bg-glass-strong text-text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-glass-border hover:border-text-primary transition-colors flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" /> Update
                  </button>
                </SettingRow>
                <SettingRow label="Two-Factor Authentication (2FA)" description="Add an extra layer of security to your account">
                  <ToggleSwitch checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                </SettingRow>
                <SettingRow label="Session Timeout" description="Automatically log out after inactivity">
                  <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className={selectClass}>
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>Never</option>
                  </select>
                </SettingRow>
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="mt-8 pt-4 border-t border-glass-border flex justify-end gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-text-secondary hover:text-text-primary font-bold uppercase tracking-[0.2em] text-[10px] px-6 py-3 rounded-xl border border-transparent hover:bg-glass transition-all"
            >
              Close
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
