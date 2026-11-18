import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import axios from "axios";
import { api } from "../api";
import {
  Download,
  Eye,
  FileText,
  LockKeyhole,
  X,
} from "lucide-react";

type FileInfo = {
  filename: string;
  size: number;
  createdAt: string;
  downloadLink: string;
  is_protected: boolean;
};

export const DownloadPage = () => {
  const { uuid } = useParams({ from: '/files/$uuid' });
  const [password, setPassword] = useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    let active = true;

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/files/${uuid}`);
        if (active) {
          setFileInfo(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadFile();
    return () => {
      active = false;
    };
  }, [uuid]);

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
            if (fileInfo.is_protected) {
                const response = await api.get(`/files/download/${uuid}`, {
                    headers: { "X-File-Password": password },
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

        } catch (err: unknown) {
            console.error("Download error:", err);
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setDownloadError("Incorrect password.");
            } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                const detail = (
                  err.response.data as { detail?: string } | undefined
                )?.detail;
                setDownloadError(detail || "File not found or expired.");
            } else {
                setDownloadError("Download failed.");
            }
        }
    }
  };

  const handlePreview = async () => {
    if (!showPreview) {
      setShowPreview(true);
      setDownloadError(null);

      if (fileInfo?.is_protected && !password) {
        return;
      }

      try {
        const response = await api.get(`/files/preview/${uuid}`, {
          headers: fileInfo?.is_protected
            ? { "X-File-Password": password }
            : undefined,
          responseType: "blob",
        });
        const nextPreviewUrl = window.URL.createObjectURL(response.data);
        if (previewUrl) {
          window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(nextPreviewUrl);
      } catch (err: unknown) {
        setShowPreview(false);
        setDownloadError(
          axios.isAxiosError(err) && err.response?.status === 401
            ? "Incorrect password."
            : "Failed to load preview",
        );
      }
    } else {
      setShowPreview(false);
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-accent mb-3 text-sm font-medium">Incoming transfer</p>
        <h1 className="text-primary text-3xl font-semibold tracking-tight">
          File ready
        </h1>
      </div>

      <div className="transfer-receipt p-5 sm:p-8">
        {isLoading ? (
            <div className="text-muted flex h-48 items-center justify-center text-sm">
                Loading transfer
            </div>
        ) : error ? (
            <div className="rounded-xl border border-[#d66a62]/20 bg-[#d66a62]/10 p-5 text-[#a94b45] light:text-[#7d2f2a]">
                <p className="font-medium">Transfer unavailable</p>
                <p className="text-sm mt-1">
                  {axios.isAxiosError(error)
                    ? (error.response?.data as { detail?: string } | undefined)?.detail ||
                      "This transfer may have expired or reached its download limit."
                    : "This transfer may have expired or reached its download limit."}
                </p>
            </div>
        ) : fileInfo ? (
          <div className="space-y-6">
            <div className="hairline flex items-start justify-between border-b pb-5">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="text-accent hairline grid h-10 w-10 shrink-0 place-items-center rounded-lg border">
                        <FileText size={18} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                        <p className="text-primary truncate font-medium">{fileInfo.filename}</p>
                        <p className="text-muted mt-1 font-mono text-xs">
                            {(fileInfo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                </div>
                {fileInfo.is_protected && (
                    <span className="text-secondary hairline flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs">
                        <LockKeyhole size={14} strokeWidth={1.5} />
                        Protected
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-muted text-xs">Uploaded</p>
                    <p className="text-secondary mt-2 font-mono text-sm">
                        {new Date(fileInfo.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <p className="text-muted text-xs">Transfer</p>
                    <p className="text-accent mt-2 font-mono text-sm">{uuid.slice(0, 8).toUpperCase()}</p>
                </div>
            </div>

            {/* Preview */}
            {canPreview && (
              <div className="space-y-2">
                <button
                  onClick={handlePreview}
                  className="btn-secondary w-full text-sm"
                >
                  {showPreview ? <X size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  {showPreview ? "Close preview" : "Preview"}
                </button>
                
                {showPreview && (
                  <div className="rounded-xl border border-white/[0.08] bg-black/10 p-3 light:border-[#dfe3dc] light:bg-[#f4f5f1]">
                    {!password && fileInfo.is_protected ? (
                      <p className="text-muted py-8 text-center text-sm">Enter the password to preview</p>
                    ) : previewUrl && isImage ? (
                      <img
                        src={previewUrl}
                        alt={fileInfo.filename}
                        className="max-h-[480px] w-full rounded-lg object-contain"
                        onError={() => setDownloadError("Failed to load preview")}
                      />
                    ) : previewUrl && isPDF ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-96 rounded-lg"
                        title="PDF Preview"
                      />
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {fileInfo.is_protected && (
                <div>
                    <label className="text-muted mb-2 block text-xs">Password</label>
                    <input 
                        type="password" 
                        placeholder="Enter transfer password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="field"
                    />
                </div>
            )}
            
            {downloadError && (
                <div className="rounded-lg border border-[#d66a62]/20 bg-[#d66a62]/10 p-3 text-sm text-[#a94b45] light:text-[#7d2f2a]">
                    {downloadError}
                </div>
            )}

            <button
              onClick={handleDownload}
              className="w-full btn-primary flex items-center justify-center gap-2 group"
            >
              <Download size={16} strokeWidth={1.5} />
              {fileInfo.is_protected ? "Unlock and download" : "Download file"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
