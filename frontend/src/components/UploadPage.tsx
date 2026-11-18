import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "../api";
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  File as FileIcon,
  UploadCloud,
  X,
} from 'lucide-react';

export const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileLink, setFileLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Advanced Options State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>(""); // minutes
  const [maxDownloads, setMaxDownloads] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFile(file);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const fileUploadHandler = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("myFile", file);
    if (password) formData.append("password", password);
    if (expiresIn) formData.append("expires_in", expiresIn);
    if (maxDownloads) formData.append("max_downloads", maxDownloads);

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await api.post("/api/files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          setUploadProgress(
            Math.round((progressEvent.loaded / total) * 100),
          );
        },
      });
      setFileLink(response.data.file);
      setIsCopied(false);
    } catch {
      setError("File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    if (fileLink) {
      navigator.clipboard.writeText(fileLink);
      setIsCopied(true);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    setFileLink(null);
    setIsCopied(false);
    setUploadProgress(0);
    setPassword("");
    setExpiresIn("");
    setMaxDownloads("");
  };

  return (
    <div className="w-full max-w-2xl py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-accent mb-3 text-sm font-medium">New transfer</p>
        <h1 className="text-primary text-3xl font-semibold tracking-tight">
          Upload a file
        </h1>
      </div>

      <div className="glass-card p-5 sm:p-8">
        
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            relative rounded-xl border border-dashed p-8 text-center cursor-pointer transition-colors duration-150
            ${isDragActive ? 'border-[#67d8cc] bg-[#67d8cc]/[0.06]' : 'border-white/15 hover:border-white/25 light:border-[#cfd5c9] light:hover:border-[#aeb7a7]'}
          `}
        >
          <input {...getInputProps()} />
          
          {!file ? (
            <div className="space-y-4">
              <span className="text-accent hairline mx-auto grid h-12 w-12 place-items-center rounded-xl border">
                <UploadCloud size={22} strokeWidth={1.5} />
              </span>
              <p className="text-primary font-medium">
                {isDragActive ? "Release to add file" : "Drop a file or choose from your device"}
              </p>
              <p className="text-muted text-sm">One file per transfer</p>
            </div>
          ) : (
            <div className="relative z-10">
              <span className="text-accent hairline mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border">
                <FileIcon size={22} strokeWidth={1.5} />
              </span>
              <p className="text-primary mx-auto max-w-xs truncate font-medium">
                {file.name}
              </p>
              <p className="text-muted mt-2 font-mono text-xs">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
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

        {/* Advanced Options Toggle */}
        {file && !fileLink && (
            <div className="mt-4">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-secondary hover:text-primary flex h-10 items-center gap-2 text-sm"
                >
                    {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
                    {showAdvanced
                      ? <ChevronUp size={16} strokeWidth={1.5} />
                      : <ChevronDown size={16} strokeWidth={1.5} />}
                </button>
                
                {showAdvanced && (
                    <div className="mt-2 grid gap-4 rounded-xl border border-white/[0.08] bg-black/10 p-4 sm:grid-cols-2 light:border-[#dfe3dc] light:bg-[#f4f5f1]">
                        <div>
                            <label className="text-muted mb-2 block text-xs">Password protection</label>
                            <input 
                                type="password" 
                                placeholder="Optional password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="field"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-muted mb-2 block text-xs">Expires in</label>
                                <input 
                                    type="number" 
                                    placeholder="Minutes"
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(e.target.value)}
                                    className="field"
                                />
                            </div>
                            <div>
                                <label className="text-muted mb-2 block text-xs">Max downloads</label>
                                <input 
                                    type="number" 
                                    placeholder="Count"
                                    value={maxDownloads}
                                    onChange={(e) => setMaxDownloads(e.target.value)}
                                    className="field"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-6">
          {!fileLink && (
            <button
              onClick={fileUploadHandler}
              disabled={!file || isUploading}
              className="btn-primary w-full"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          )}

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08] light:bg-[#dfe3dc]">
              <div 
                className="h-full rounded-full bg-[#67d8cc] transition-[width] duration-150" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Result */}
          {fileLink && (
            <div className="transfer-receipt space-y-5 p-5">
              <div className="text-accent flex items-center gap-2 text-sm font-medium">
                <Check size={16} strokeWidth={1.5} />
                Transfer ready
              </div>
              
              {/* QR Code */}
              <div className="flex justify-center py-4">
                <div className="rounded-xl bg-[#f4f6f3] p-4">
                  <QRCodeSVG value={fileLink} size={180} />
                </div>
              </div>
              <p className="text-muted text-center text-xs">Scan to open transfer</p>
              
              {/* Link */}
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 p-3 light:border-[#dfe3dc] light:bg-white">
                <code className="text-secondary flex-1 truncate font-mono text-xs">
                  {fileLink}
                </code>
                <button
                  onClick={handleCopy}
                  className="btn-secondary h-8 px-3 text-xs"
                >
                  {isCopied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
                  {isCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-[#d66a62]/20 bg-[#d66a62]/10 p-3 text-center text-sm text-[#a94b45] light:text-[#7d2f2a]">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
