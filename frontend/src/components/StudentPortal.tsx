import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Hash, 
  Briefcase, 
  Layers, 
  Building2, 
  Calendar, 
  Loader2, 
  Check, 
  Copy
} from 'lucide-react';
import { PDFViewerModal } from './PDFViewerModal';

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://backend-six-sand-58.vercel.app').replace(/\/$/, '');

interface StudentPortalProps {
  onOpenAdmin?: () => void;
}

interface AppointmentData {
  id: string;
  name: string;
  regNo: string;
  email: string;
  role: string;
  domain: string;
  department: string;
  tenure: string;
  verificationHash: string;
  issuedAt: string;
  status: string;
}

export function StudentPortal({ onOpenAdmin }: StudentPortalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      dx: number;
      dy: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00F0FF';
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setAppointment(null);

    try {
      const response = await fetch(`${API_BASE}/api/appointments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No appointment letter found for this email address.');
      }

      setAppointment(data.appointment);
    } catch (err: any) {
      setError(err.message || 'Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!appointment) return;
    setDownloading(true);
    try {
      const downloadUrl = `${API_BASE}/api/appointments/download/${encodeURIComponent(appointment.regNo)}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to download PDF.');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Appointment_Letter_${appointment.regNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Error downloading PDF letter.');
    } finally {
      setDownloading(false);
    }
  };

  const copyHashToClipboard = () => {
    if (!appointment?.verificationHash) return;
    navigator.clipboard.writeText(appointment.verificationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 py-8">
      <div className="relative z-10 bg-[#070b14]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 hover:border-[#00F0FF]/30">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none w-full h-full opacity-40"
        />

        <div className="relative z-10 flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono tracking-wider mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
            <span>APPOINTMENT ACCESS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 font-display">
            Appointment Letter Verification
          </h1>
          <p className="text-gray-400 text-sm max-w-md">
            Enter your registered email ID to retrieve and authenticate your official Stats-O-Locked appointment letter.
          </p>
        </div>

        <form onSubmit={handleVerify} className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-mono tracking-wider text-gray-300 uppercase mb-2">
              Registered Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sankil.25bai10311@vitbhopal.ac.in"
                required
                className="w-full bg-[#0d1527]/90 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-all shadow-inner font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00F0FF] via-[#00B8FF] to-[#0070F3] hover:brightness-110 active:scale-[0.99] text-black font-semibold rounded-2xl py-4 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 text-sm sm:text-base shadow-[0_0_30px_rgba(0,240,255,0.3)] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-mono uppercase tracking-wider">Verifying Record...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span className="font-mono uppercase tracking-wider">Verify & Retrieve</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="relative z-10 mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1 font-sans">{error}</div>
          </div>
        )}

        {appointment && (
          <div className="relative z-10 mt-8 pt-8 border-t border-white/10 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#00F0FF]/5 border border-[#00F0FF]/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold font-display">Official Record Authenticated</h4>
                  <p className="text-xs text-gray-400 font-mono">Status: {appointment.status || 'Active'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider block">Issue Date</span>
                <span className="text-xs text-white font-mono">
                  {appointment.issuedAt ? new Date(appointment.issuedAt).toLocaleDateString() : 'Active Term'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <User className="w-4 h-4 text-[#00F0FF]" />
                <div>
                  <span className="text-gray-400 text-xs block">Full Name</span>
                  <span className="text-white font-medium">{appointment.name}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <Hash className="w-4 h-4 text-[#00F0FF]" />
                <div>
                  <span className="text-gray-400 text-xs block">Registration No.</span>
                  <span className="text-white font-mono font-medium">{appointment.regNo}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-[#00F0FF]" />
                <div>
                  <span className="text-gray-400 text-xs block">Assigned Role</span>
                  <span className="text-[#00F0FF] font-semibold">{appointment.role}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <Layers className="w-4 h-4 text-[#00F0FF]" />
                <div>
                  <span className="text-gray-400 text-xs block">Domain</span>
                  <span className="text-white font-medium">{appointment.domain}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <Building2 className="w-4 h-4 text-[#00F0FF]" />
                <div>
                  <span className="text-gray-400 text-xs block">Department</span>
                  <span className="text-white font-medium">{appointment.department}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#00F0FF]" />
                <div>
                  <span className="text-gray-400 text-xs block">Tenure Term</span>
                  <span className="text-white font-medium">{appointment.tenure}</span>
                </div>
              </div>
            </div>

            {appointment.verificationHash && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase text-gray-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                    Verification Hash
                  </span>
                  <button
                    onClick={copyHashToClipboard}
                    className="text-xs text-[#00F0FF] hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Hash
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-300 break-all bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  {appointment.verificationHash}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex-1 bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/10 text-white rounded-2xl py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-gray-300" />
                <span>Preview Letter</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 bg-[#00F0FF] hover:bg-[#00F0FF]/90 active:scale-[0.99] text-black rounded-2xl py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-pointer disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPreviewModal && appointment && (
        <PDFViewerModal
          pdfUrl={`${API_BASE}/api/appointments/download/${encodeURIComponent(appointment.regNo)}`}
          title={`Appointment Letter - ${appointment.name}`}
          regNo={appointment.regNo}
          name={appointment.name}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
