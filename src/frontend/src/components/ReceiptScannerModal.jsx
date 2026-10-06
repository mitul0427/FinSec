import React, { useState } from 'react';
import { UploadCloud, Cpu, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { receiptApi } from '../utils/api';

export const ReceiptScannerModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
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
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to scan receipt');
      setResult(data);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">AI Receipt Vision OCR Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 bg-slate-50 transition-all text-center">
          {previewUrl ? (
            <div className="space-y-3 w-full">
              <img
                src={previewUrl}
                alt="Receipt Preview"
                className="max-h-48 mx-auto rounded-xl border border-slate-200 object-contain shadow-md"
              />
              <label className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer block">
                Change Receipt Image
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="cursor-pointer space-y-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Click or drop receipt image here</p>
                <p className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WebP (Max 10MB)</p>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result?.receipt && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-900">Extracted JSON Payload:</p>
            <pre className="text-[10px] font-mono text-slate-700 overflow-x-auto bg-white p-3 rounded-xl border border-slate-200 max-h-36">
              {JSON.stringify(result.receipt, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>

          {selectedFile && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center space-x-2"
            >
              {scanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Parsing Image...</span>
                </>
              ) : (
                <span>Run Gemini Vision AI</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
