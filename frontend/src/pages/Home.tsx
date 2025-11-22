import { Link } from '@tanstack/react-router';

export const Home = () => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-20 px-4">
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 rounded-full"></div>
          <h1 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-2xl relative z-10">
            Share Files Instantly
          </h1>
        </div>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Upload, share, and download files securely with password protection and automatic expiration.
        </p>
        <Link to="/upload">
          <button className="btn-primary text-lg px-8 py-4">
            Start Sharing →
          </button>
        </Link>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 px-4 py-12">
        <div className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300">
          <div className="text-5xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-white mb-2">Secure</h3>
          <p className="text-slate-400">
            Optional password protection and end-to-end encryption keep your files safe.
          </p>
        </div>

        <div className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300">
          <div className="text-5xl mb-4">⚡</div>
          <h3 className="text-xl font-bold text-white mb-2">Fast</h3>
          <p className="text-slate-400">
            Lightning-fast uploads and downloads with our optimized infrastructure.
          </p>
        </div>

        <div className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300">
          <div className="text-5xl mb-4">⏱️</div>
          <h3 className="text-xl font-bold text-white mb-2">Simple</h3>
          <p className="text-slate-400">
            No account needed. Just drag, drop, and share. It's that easy.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Upload Your File</h4>
            <p className="text-slate-400 text-sm">
              Drag and drop or click to browse files from your device
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Set Options</h4>
            <p className="text-slate-400 text-sm">
              Add password protection, expiration time, or download limits
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Share the Link</h4>
            <p className="text-slate-400 text-sm">
              Copy the link or scan the QR code to share with anyone
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
