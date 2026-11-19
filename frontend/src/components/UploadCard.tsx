import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Check, ChevronDown, ChevronUp, Copy, File as FileIcon, UploadCloud, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import { formatFileSize } from '../format';

const EXPIRATION_PRESETS = [
  { label: '15m', minutes: '15' },
  { label: '1h', minutes: '60' },
  { label: '24h', minutes: '1440' },
  { label: '7d', minutes: '10080' },
];

export const UploadCard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileLink, setFileLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const fileUploadHandler = async () => {
    if (!file) {
      setError('No file selected.');
      return;
    }
    const formData = new FormData();
    formData.append('myFile', file);
    if (password) formData.append('password', password);
    if (expiresIn) formData.append('expires_in', expiresIn);
    if (maxDownloads) formData.append('max_downloads', maxDownloads);
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const response = await api.post('/api/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          setUploadProgress(Math.round((progressEvent.loaded / total) * 100));
        },
      });
      setFileLink(`${window.location.origin}/files/${response.data.uuid}`);
      setIsCopied(false);
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as { detail?: string } | undefined)?.detail
        : undefined;
      setError(typeof detail === 'string' ? detail : 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    if (!fileLink) return;
    navigator.clipboard.writeText(fileLink);
    setIsCopied(true);
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    setFileLink(null);
    setIsCopied(false);
    setUploadProgress(0);
    setPassword('');
    setExpiresIn('');
    setMaxDownloads('');
    setShowAdvanced(false);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetForm();
  };

  return (
    <div className="glass-card p-5 sm:p-7">
      {!fileLink && (
        <div
          {...getRootProps()}
          className={`relative cursor-pointer rounded-xl border border-dashed p-8 text-center transition-colors duration-150 ${
            isDragActive
              ? 'border-[var(--accent)] bg-[var(--accent-tint)]'
              : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
          }`}
        >
          <input {...getInputProps()} />
          {!file ? (
            <div className="space-y-3 py-4">
              <span className="text-accent hairline mx-auto grid h-12 w-12 place-items-center rounded-xl border">
                <UploadCloud size={22} strokeWidth={1.5} />
              </span>
              <p className="text-primary font-medium">
                {isDragActive ? 'Release to add file' : 'Drop a file or choose from your device'}
              </p>
              <p className="text-muted text-sm">One file per transfer</p>
            </div>
          ) : (
            <div className="relative z-10 py-2">
              <span className="text-accent hairline mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl border">
                <FileIcon size={22} strokeWidth={1.5} />
              </span>
              <p className="text-primary mx-auto max-w-xs truncate font-medium">{file.name}</p>
              <p className="text-muted mt-1 font-mono text-xs">{formatFileSize(file.size)}</p>
              <button
                onClick={clearFile}
                className="surface-raised hairline text-secondary absolute -right-3 -top-3 grid h-8 w-8 place-items-center rounded-lg border"
                aria-label="Remove file"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      )}

      {file && !fileLink && (
        <div className="mt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-secondary hover:text-primary flex h-9 items-center gap-2 text-sm"
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            {showAdvanced ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
          </button>
          {showAdvanced && (
            <div className="surface-subtle hairline mt-2 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
              <div>
                <label className="text-muted mb-1.5 block text-xs">Password protection</label>
                <input
                  type="password"
                  placeholder="Optional password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label className="text-muted mb-1.5 block text-xs">Max downloads</label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  min="1"
                  max="1000"
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(e.target.value)}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-muted text-xs">Expires in (minutes)</label>
                  <div className="flex gap-1.5">
                    {EXPIRATION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setExpiresIn(preset.minutes)}
                        className={`rounded-md px-2 py-0.5 font-mono text-xs transition-colors ${
                          expiresIn === preset.minutes
                            ? 'bg-[var(--accent-tint)] text-accent'
                            : 'text-muted hover:text-primary surface-raised'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  placeholder="Optional minutes"
                  min="1"
                  max="43200"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="field"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className={fileLink ? 'space-y-5' : 'mt-6 space-y-4'}>
        {!fileLink && (
          <button onClick={fileUploadHandler} disabled={!file || isUploading} className="btn-primary w-full">
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload File'}
          </button>
        )}

        {isUploading && (
          <div className="surface-subtle h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {fileLink && (
          <div className="space-y-5">
            <div className="text-accent flex items-center gap-2 text-sm font-medium">
              <Check size={16} strokeWidth={1.5} />
              Transfer ready
            </div>
            <div className="flex justify-center py-2">
              <div className="rounded-xl bg-white p-4">
                <QRCodeSVG value={fileLink} size={172} />
              </div>
            </div>
            <p className="text-muted text-center text-xs">Scan to open transfer</p>
            <div className="surface-subtle hairline flex items-center gap-2 rounded-lg border p-3">
              <code className="text-secondary flex-1 truncate font-mono text-xs">{fileLink}</code>
              <button onClick={handleCopy} className="btn-secondary h-8 px-3 text-xs">
                {isCopied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button onClick={resetForm} className="btn-secondary w-full text-xs">
              Upload another file
            </button>
          </div>
        )}

        {error && <div className="alert-error text-center">{error}</div>}
      </div>
    </div>
  );
};
