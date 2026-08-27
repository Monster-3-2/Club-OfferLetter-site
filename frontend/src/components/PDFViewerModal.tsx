import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, X, ZoomIn, ZoomOut, Maximize, ExternalLink, RefreshCw } from 'lucide-react';

interface PDFViewerModalProps {
  documentUrl: string;
  candidateName: string;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  documentUrl,
  candidateName,
  onClose
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 75));

  const downloadUrl = `${documentUrl}?download=true`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-[#091424] border border-[#00F0FF]/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#050B14] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00F0FF]/10 text-[#00F0FF] rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-white text-base sm:text-lg">
                APPOINTMENT LETTER &mdash; {candidateName}
              </h3>
              <p className="text-xs font-mono text-[#00F0FF] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                VERIFIED DOCUMENT &bull; STATS-O-LOCKED
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 w-12 text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-800 my-auto mx-1" />
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition ml-2"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame Area */}
        <div className="flex-1 bg-[#1E293B] relative overflow-auto flex items-center justify-center p-4">
          <div
            style={{ width: `${zoom}%`, height: '100%' }}
            className="transition-all duration-200 shadow-2xl flex items-center justify-center"
          >
            <iframe
              src={`${documentUrl}#toolbar=0&navpanes=0`}
              title="PDF Viewer"
              className="w-full h-full rounded-lg bg-white border-0"
            />
          </div>
        </div>

        {/* Footer Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#050B14] border-t border-slate-800 flex-wrap gap-3">
          <div className="text-xs font-mono text-slate-400">
            Rendered over official VIT Bhopal Stats-O-Locked Letterhead
          </div>

          <div className="flex items-center gap-3">
            <a
              href={documentUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Open New Tab
            </a>
            <a
              href={downloadUrl}
              download
              className="px-5 py-2 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-extrabold text-xs tracking-wider uppercase rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:scale-105 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> DOWNLOAD APPOINTMENT LETTER
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
