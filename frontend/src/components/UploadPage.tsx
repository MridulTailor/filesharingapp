import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api";
import { QRCodeSVG } from 'qrcode.react';

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

  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const formData = new FormData();
      formData.append("myFile", fileToUpload);
      if (password) formData.append("password", password);
      if (expiresIn) formData.append("expires_in", expiresIn);
      if (maxDownloads) formData.append("max_downloads", maxDownloads);

      const response = await api.post("/api/files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const progress = Math.round((progressEvent.loaded / total) * 100);
          setUploadProgress(progress);
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setFileLink(data.file);
      setIsCopied(false);
      setError(null);
    },
    onError: () => {
      setError("File upload failed");
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFile(file);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const fileUploadHandler = () => {
    if (!file) {
      setError("No file selected.");
      return;
    }
    uploadMutation.mutate(file);
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
    uploadMutation.reset();
  };

  return (
    <div className="w-full max-w-lg">
      <div className="glass-card p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
        
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group
            ${isDragActive ? 'border-cyan-400 bg-cyan-400/10 scale-105' : 'border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800/50'}
          `}
        >
          <input {...getInputProps()} />
          
          {!file ? (
            <div className="space-y-4">
              <div className={`text-6xl transition-transform duration-300 ${isDragActive ? 'scale-125 animate-bounce' : 'group-hover:scale-110'}`}>
                📂
              </div>
              <p className="text-slate-300 font-medium text-lg">
                {isDragActive ? "Drop it like it's hot!" : "Drag & drop or click to upload"}
              </p>
              <p className="text-slate-500 text-sm">Any file, any size (almost)</p>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-white font-semibold text-lg truncate max-w-xs mx-auto">
                {file.name}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button 
                onClick={clearFile}
                className="absolute -top-8 -right-8 p-2 text-slate-400 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Advanced Options Toggle */}
        {file && !fileLink && (
            <div className="mt-4">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-cyan-400 text-sm hover:underline flex items-center gap-1"
                >
                    {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
                    <span>{showAdvanced ? "▲" : "▼"}</span>
                </button>
                
                {showAdvanced && (
                    <div className="mt-4 space-y-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700 animate-fade-in">
                        <div>
                            <label className="block text-slate-400 text-xs mb-1">Password Protection</label>
                            <input 
                                type="password" 
                                placeholder="Optional password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Expires In (Minutes)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 60"
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs mb-1">Max Downloads</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 1"
                                    value={maxDownloads}
                                    onChange={(e) => setMaxDownloads(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
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
              disabled={!file || uploadProgress > 0}
              className={`w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                ${uploadMutation.isPending ? 'animate-pulse' : ''}
              `}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload File"}
            </button>
          )}

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Result */}
          {fileLink && (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 animate-fade-in space-y-4">
              <p className="text-cyan-400 text-sm font-semibold mb-2 uppercase tracking-wider">Download Link Ready!</p>
              
              {/* QR Code */}
              <div className="flex justify-center py-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={fileLink} size={180} />
                </div>
              </div>
              <p className="text-center text-slate-400 text-xs">Scan with your phone to share</p>
              
              {/* Link */}
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3">
                <code className="text-slate-300 text-sm truncate flex-1 font-mono">
                  {fileLink}
                </code>
                <button
                  onClick={handleCopy}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
