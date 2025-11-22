import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export const DownloadPage = () => {
  const { uuid } = useParams({ from: '/files/$uuid' });
  const [password, setPassword] = useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: fileInfo, isLoading, error } = useQuery({
    queryKey: ["file", uuid],
    queryFn: async () => {
      const response = await api.get(`/files/${uuid}`);
      return response.data;
    },
    retry: false,
  });

  // Check if file can be previewed
  const canPreview = fileInfo?.filename && [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'
  ].some(ext => fileInfo.filename.toLowerCase().endsWith(ext));

  const isImage = fileInfo?.filename && [
    '.jpg', '.jpeg', '.png', '.gif', '.webp'
  ].some(ext => fileInfo.filename.toLowerCase().endsWith(ext));

  const isPDF = fileInfo?.filename?.toLowerCase().endsWith('.pdf');

  const handleDownload = async () => {
    if (fileInfo?.downloadLink) {
        if (fileInfo.is_protected && !password) {
            setDownloadError("Password is required for this file.");
            return;
        }

        try {
            // Construct URL with password if needed
            let url = fileInfo.downloadLink;
            if (password) {
                url += `?password=${encodeURIComponent(password)}`;
            }
            
            // Trigger download by navigating (or using a hidden iframe/link)
            // For protected files, we might need to handle the response directly if it's an API call, 
            // but since the backend returns a file stream, setting window.location.href works 
            // IF the browser handles the 401 correctly (it might show a browser prompt or just fail).
            // Better approach for protected files: fetch blob and download.
            
            if (fileInfo.is_protected) {
                const response = await api.get(`/files/download/${uuid}`, {
                    params: { password },
                    responseType: 'blob'
                });
                
                const blob = new Blob([response.data]);
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.setAttribute('download', fileInfo.filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);
                setDownloadError(null);
            } else {
                window.location.href = fileInfo.downloadLink;
            }

        } catch (err: any) {
            console.error("Download error:", err);
            if (err.response?.status === 401) {
                setDownloadError("Incorrect password.");
            } else if (err.response?.status === 404) {
                setDownloadError(err.response.data.detail || "File not found or expired.");
            } else {
                setDownloadError("Download failed.");
            }
        }
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="glass-card p-8 text-center transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
        <div className="mb-6 relative inline-block">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <div className="text-7xl relative z-10 animate-float">📦</div>
        </div>

        <h2 className="text-3xl font-bold mb-2 text-white">Ready to Download</h2>
        <p className="text-slate-400 mb-8">Your file is served hot and fresh.</p>

        {isLoading ? (
            <div className="flex justify-center items-center space-x-2 text-cyan-400">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                <p className="font-semibold">Oops! Link Expired or Invalid</p>
                <p className="text-sm mt-1">{(error as any).response?.data?.detail || "This file might have been deleted or never existed."}</p>
            </div>
        ) : fileInfo ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-left">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm uppercase tracking-wider">Filename</span>
                    <span className="text-cyan-400 text-xs font-mono bg-cyan-400/10 px-2 py-1 rounded">
                        {(fileInfo.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                </div>
                <p className="text-white font-medium text-lg truncate" title={fileInfo.filename}>
                    {fileInfo.filename}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-slate-500 text-xs">Uploaded</span>
                    <span className="text-slate-400 text-sm">
                        {new Date(fileInfo.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Preview */}
            {canPreview && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-secondary w-full text-sm"
                >
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
                
                {showPreview && (
                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    {!password && fileInfo.is_protected ? (
                      <p className="text-slate-400 text-sm text-center">Enter password to preview</p>
                    ) : isImage ? (
                      <img
                        src={`http://localhost:3001/files/preview/${uuid}${password ? `?password=${encodeURIComponent(password)}` : ''}`}
                        alt={fileInfo.filename}
                        className="w-full rounded-lg"
                        onError={() => setDownloadError("Failed to load preview")}
                      />
                    ) : isPDF ? (
                      <iframe
                        src={`http://localhost:3001/files/preview/${uuid}${password ? `?password=${encodeURIComponent(password)}` : ''}`}
                        className="w-full h-96 rounded-lg"
                        title="PDF Preview"
                      />
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {fileInfo.is_protected && (
                <div className="text-left">
                    <label className="block text-slate-400 text-xs mb-1">Password Required</label>
                    <input 
                        type="password" 
                        placeholder="Enter password to download"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                </div>
            )}
            
            {downloadError && (
                <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">
                    {downloadError}
                </div>
            )}

            <button
              onClick={handleDownload}
              className="w-full btn-primary flex items-center justify-center gap-2 group"
            >
              <span>{fileInfo.is_protected ? "Unlock & Download" : "Download Now"}</span>
              <span className="group-hover:translate-y-1 transition-transform">↓</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
