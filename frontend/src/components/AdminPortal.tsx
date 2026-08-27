import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Mail, Key, LayoutDashboard, Users, UserPlus, Upload, 
  FileCheck, Settings, LogOut, Cpu, Database, Server, Activity, Menu, X, Plus, AlertTriangle 
} from 'lucide-react';

import { AppointmentsTable, AppointmentItem } from './AppointmentsTable';
import { AddEditAppointmentModal, DeleteConfirmModal } from './AppointmentModals';
import { CSVImporter } from './CSVImporter';
import { PDFViewerModal } from './PDFViewerModal';

interface AdminPortalProps {
  onBackToStudent: () => void;
}

interface StatsData {
  total: number;
  verified: number;
  pending: number;
  documentsAvailable: number;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToStudent }) => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [adminUser, setAdminUser] = useState<{ id: string; name: string; email: string } | null>(null);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('admin@statsolocked.in');
  const [loginPassword, setLoginPassword] = useState<string>('admin123');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'APPOINTMENTS' | 'BULK_IMPORT' | 'SETTINGS'>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Dashboard Data
  const [stats, setStats] = useState<StatsData>({ total: 0, verified: 0, pending: 0, documentsAvailable: 0 });
  const [systemStatus, setSystemStatus] = useState<Record<string, string>>({
    database: 'ONLINE', storage: 'ONLINE', api: 'ONLINE', auth: 'ACTIVE'
  });

  // Appointments List State
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedAppt, setSelectedAppt] = useState<AppointmentItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);

  // Check auth session on load
  useEffect(() => {
    if (token) {
      fetchAdminMe();
      fetchStats();
      fetchAppointments();
    }
  }, [token]);

  // Fetch Appointments when params change
  useEffect(() => {
    if (token) {
      fetchAppointments();
    }
  }, [search, statusFilter, deptFilter, sortBy, page, limit, token]);

  const fetchAdminMe = async () => {
    try {
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setAdminUser(data.admin);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
        if (data.systemStatus) setSystemStatus(data.systemStatus);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status: statusFilter,
        department: deptFilter,
        sortBy
      });

      const res = await fetch(`/api/admin/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.ok) {
        setAppointments(data.appointments);
        setTotalPages(data.pagination.totalPages);
        setTotalRecords(data.pagination.totalRecords);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (!data.ok) {
        setLoginError(data.error || 'Authentication failed.');
        setLoginLoading(false);
        return;
      }

      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setAdminUser(data.admin);
      setLoginLoading(false);
    } catch (err) {
      setLoginError('Server authentication error.');
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setAdminUser(null);
  };

  // Save Add/Edit Appointment
  const handleSaveAppointment = async (formData: FormData) => {
    const isEdit = showEditModal && selectedAppt;
    const url = isEdit ? `/api/admin/appointments/${selectedAppt.id}` : '/api/admin/appointments';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error || 'Failed to save appointment.');
    }

    fetchStats();
    fetchAppointments();
  };

  // Delete Appointment
  const handleDeleteConfirm = async () => {
    if (!selectedAppt) return;
    const res = await fetch(`/api/admin/appointments/${selectedAppt.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.ok) {
      alert(data.error || 'Failed to delete record.');
    } else {
      fetchStats();
      fetchAppointments();
    }
  };

  // --------------------------------------------------------------------------
  // LOGIN SCREEN (If not authenticated)
  // --------------------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-[#050B14] bg-grid-pattern text-white flex flex-col items-center justify-center p-4 relative font-sans select-none">
        
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <button
            onClick={onBackToStudent}
            className="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1.5"
          >
            &larr; STUDENT PORTAL
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#091424]/90 border border-slate-800 p-8 rounded-3xl shadow-2xl hud-box space-y-6"
        >
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-[#00F0FF]/10 text-[#00F0FF] rounded-full flex items-center justify-center mx-auto border border-[#00F0FF]/30">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-heading font-black text-2xl text-white tracking-wider">
              STATS-O-LOCKED ADMIN
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Appointment Management System Access
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
              ⚠ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                ADMIN EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@statsolocked.in"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 transition"
            >
              {loginLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[11px] font-mono text-slate-500">
              Demo Credentials: <code className="text-[#00F0FF]">admin@statsolocked.in</code> / <code className="text-[#00F0FF]">admin123</code>
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ADMIN CONTROL CENTER DASHBOARD (AUTHENTICATED)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-sans">
      
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-[#091424] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-9 h-9 rounded-full border border-[#00F0FF] p-0.5 bg-white">
              <img src="/stats_club_logo.png" alt="Stats Emblem" className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <h1 className="font-heading font-black text-lg text-white tracking-wider leading-none">
                STATS-O-LOCKED ADMIN
              </h1>
              <span className="text-[10px] font-mono text-[#00F0FF]">APPOINTMENT CONTROL CENTER</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-white leading-none">{adminUser?.name || 'Administrator'}</p>
              <p className="text-[10px] font-mono text-slate-400">{adminUser?.email}</p>
            </div>
            <button
              onClick={onBackToStudent}
              className="px-3 py-1.5 text-xs font-mono text-[#00F0FF] hover:bg-[#00F0FF]/10 rounded-lg border border-[#00F0FF]/30 transition"
            >
              STUDENT VIEW
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Logout Session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6">
        
        {/* Sidebar (Desktop & Mobile Drawer) */}
        <aside
          className={`md:w-64 flex-shrink-0 bg-[#091424] border border-slate-800 rounded-2xl p-4 space-y-6 h-fit ${
            mobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 w-64 shadow-2xl' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between md:hidden pb-4 border-b border-slate-800">
            <span className="font-heading font-bold text-sm text-white">MENU</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3">
              CONTROL CENTER
            </span>
            <button
              onClick={() => { setActiveTab('DASHBOARD'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs tracking-wider uppercase transition ${
                activeTab === 'DASHBOARD' ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>

            <button
              onClick={() => { setActiveTab('APPOINTMENTS'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs tracking-wider uppercase transition ${
                activeTab === 'APPOINTMENTS' ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" /> Appointments
            </button>

            <button
              onClick={() => {
                setShowAddModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs tracking-wider uppercase text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" /> Add Appointment
            </button>

            <button
              onClick={() => { setActiveTab('BULK_IMPORT'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs tracking-wider uppercase transition ${
                activeTab === 'BULK_IMPORT' ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Upload className="w-4 h-4 text-amber-400" /> Bulk Import
            </button>
          </div>

          {/* System Status Indicators Box */}
          <div className="p-3.5 bg-[#050B14] border border-slate-800 rounded-xl space-y-2 font-mono text-[10.5px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1">SYSTEM STATUS</span>
            <div className="flex items-center justify-between text-slate-300">
              <span>DATABASE</span> <span className="text-emerald-400 font-bold">● {systemStatus.database}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>STORAGE</span> <span className="text-emerald-400 font-bold">● {systemStatus.storage}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>API</span> <span className="text-emerald-400 font-bold">● {systemStatus.api}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>AUTH</span> <span className="text-emerald-400 font-bold">● {systemStatus.auth}</span>
            </div>
          </div>
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 space-y-6 min-w-0">
          
          {/* Dashboard Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-[#091424] border border-slate-800 p-6 rounded-3xl hud-box">
            <div>
              <h2 className="font-heading font-black text-2xl text-white tracking-wide">
                ADMIN CONTROL CENTER
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Stats-O-Locked Official Appointment Management System
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> ADD APPOINTMENT
              </button>
            </div>
          </div>

          {/* Statistics Counters Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#091424] border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">TOTAL APPOINTMENTS</span>
              <p className="font-heading font-black text-3xl text-white mt-1">{stats.total}</p>
            </div>

            <div className="bg-[#091424] border border-emerald-500/30 p-5 rounded-2xl">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">VERIFIED</span>
              <p className="font-heading font-black text-3xl text-emerald-400 mt-1">{stats.verified}</p>
            </div>

            <div className="bg-[#091424] border border-amber-500/30 p-5 rounded-2xl">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">PENDING</span>
              <p className="font-heading font-black text-3xl text-amber-400 mt-1">{stats.pending}</p>
            </div>

            <div className="bg-[#091424] border border-[#00F0FF]/30 p-5 rounded-2xl">
              <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase">DOCUMENTS AVAILABLE</span>
              <p className="font-heading font-black text-3xl text-[#00F0FF] mt-1">{stats.documentsAvailable}</p>
            </div>
          </div>

          {/* Main Workspace Tabs */}
          {activeTab === 'BULK_IMPORT' ? (
            <CSVImporter
              onComplete={() => {
                fetchStats();
                fetchAppointments();
                setActiveTab('APPOINTMENTS');
              }}
            />
          ) : (
            <AppointmentsTable
              appointments={appointments}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              deptFilter={deptFilter}
              onDeptFilterChange={setDeptFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              page={page}
              totalPages={totalPages}
              limit={limit}
              totalRecords={totalRecords}
              onPageChange={setPage}
              onLimitChange={setLimit}
              onView={(appt) => setViewPdfUrl(`/api/appointments/${appt.id}/document`)}
              onEdit={(appt) => {
                setSelectedAppt(appt);
                setShowEditModal(true);
              }}
              onDelete={(appt) => {
                setSelectedAppt(appt);
                setShowDeleteModal(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Modal */}
      <AddEditAppointmentModal
        isOpen={showAddModal || showEditModal}
        isEditing={showEditModal}
        initialData={selectedAppt}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedAppt(null);
        }}
        onSave={handleSaveAppointment}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        appointment={selectedAppt}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAppt(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* PDF Viewer Modal */}
      {viewPdfUrl && (
        <PDFViewerModal
          documentUrl={viewPdfUrl}
          candidateName={selectedAppt?.fullName || 'Appointment'}
          onClose={() => setViewPdfUrl(null)}
        />
      )}
    </div>
  );
};
