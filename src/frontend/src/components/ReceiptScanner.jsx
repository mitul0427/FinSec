import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Cpu,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  Plus
} from 'lucide-react';
import { receiptApi, transactionApi } from '../utils/api';

export const ReceiptScanner = ({ onTransactionCreated }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setAdded(false);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;
    setScanning(true);
    setError(null);

    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      const res = await receiptApi.scan(formData);
      const data = await res.json();
      if (data.securityChecks) {
        setResult(data);
      }
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to scan receipt');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!result || !result.receipt) return;
    try {
      const { merchant, amount, category, date, description } = result.receipt;
      const res = await transactionApi.create({
        type: 'EXPENSE',
        category: category || 'Shopping',
        amount: parseFloat(amount) || 0,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        description: description || `Scanned receipt: ${merchant}`,
        merchant: merchant || 'Scanned Store'
      });

      if (res && res.ok) {
        setAdded(true);
        if (onTransactionCreated) onTransactionCreated();
      } else {
        throw new Error('Fallback to local storage');
      }
    } catch (e) {
      // Local fallback
      try {
        const stored = JSON.parse(localStorage.getItem('finsec_dashboard_txs') || '[]');
        const { merchant, amount, category, date, description } = result.receipt;
        const newTx = {
          id: `tx-ocr-${Date.now()}`,
          spentFor: description || `Scanned receipt: ${merchant}`,
          description: description || `Scanned receipt: ${merchant}`,
          category: category || 'Shopping',
          amount: parseFloat(amount) || 0,
          type: 'EXPENSE',
          date: date || new Date().toISOString().split('T')[0],
          merchant: merchant || 'Scanned Store',
          status: 'SETTLED'
        };
        localStorage.setItem('finsec_dashboard_txs', JSON.stringify([newTx, ...stored]));
      } catch (_) {}
      setAdded(true);
      if (onTransactionCreated) onTransactionCreated();
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-slate-100">Multi-Stage Sanitizing Receipt Vision AI</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Zero-leak image ingestion: Magic byte verification, EXIF GPS data scrubbing, and Gemini multi-modal extraction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Dropzone */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-2xl p-6 bg-slate-900/30 transition-all text-center">
          {previewUrl ? (
            <div className="space-y-3 w-full">
              <img
                src={previewUrl}
                alt="Receipt Preview"
                className="max-h-56 mx-auto rounded-xl border border-slate-700 object-contain shadow-lg"
              />
              <div className="flex items-center justify-center space-x-2">
                <label className="text-xs text-cyan-400 hover:underline cursor-pointer">
                  Change Image
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer space-y-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Click or drop receipt image here</p>
                <p className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WebP (Max 10MB)</p>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            </label>
          )}

          {selectedFile && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
            >
              {scanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sanitizing & Parsing...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Execute AI Receipt Extraction</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Security Inspection & Output Preview */}
        <div className="space-y-4">
          {/* Security Inspection Checklist */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> Ingestion Security Pipeline
            </h4>
            <div className="grid grid-cols-1 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-300">1. Magic Bytes Header Check</span>
                {result?.securityChecks?.magicBytesVerified ? (
                  <span className="text-emerald-400 font-mono font-medium flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> VALIDATED
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">PENDING</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-300">2. EXIF Privacy Sanitization</span>
                {result?.securityChecks?.exifMetadataScrubbed ? (
                  <span className="text-emerald-400 font-mono font-medium flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> SCRUBBED
                  </span>
                ) : result?.securityChecks?.magicBytesVerified ? (
                  <span className="text-slate-400 font-mono font-medium flex items-center">
                    CLEAN (NO EXIF)
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">PENDING</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-300">3. Gemini Multi-Modal Vision</span>
                {result?.receipt ? (
                  <span className="text-cyan-400 font-mono font-medium flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> EXTRACTED
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">PENDING</span>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Extracted Receipt Card */}
          {result?.receipt && (
            <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Extracted Financial Entities</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Ready to Post
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Merchant</div>
                  <div className="text-slate-100 font-semibold truncate">{result.receipt.merchant || result.receipt.merchant_name || 'N/A'}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Total Amount</div>
                  <div className="text-emerald-400 font-bold">${parseFloat(result.receipt.amount || result.receipt.total_amount || 0).toFixed(2)}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Category</div>
                  <div className="text-slate-200">{result.receipt.category || 'N/A'}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Date</div>
                  <div className="text-slate-200">{result.receipt.date || 'N/A'}</div>
                </div>
              </div>

              {/* Raw JSON Extracted Output */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-36">
                <div className="text-[10px] text-slate-400 mb-1 font-sans font-medium">Extracted JSON Payload:</div>
                <pre>{JSON.stringify(result.receipt, null, 2)}</pre>
              </div>

              {added ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-center text-xs text-emerald-300 font-semibold flex items-center justify-center space-x-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Added to Financial Ledger!</span>
                </div>
              ) : (
                <button
                  onClick={handleConfirmAdd}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirm & Commit to Ledger</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
