import { Link } from '@tanstack/react-router';
import { ArrowRight, Clock3, LockKeyhole, QrCode, Upload } from 'lucide-react';

export const Home = () => {
  return (
    <div className="w-full max-w-6xl py-12 sm:py-16 lg:py-20">
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_480px]">
        <div className="max-w-xl">
          <p className="text-accent mb-5 text-sm font-medium">Temporary file transfer</p>
          <h1 className="text-primary max-w-lg text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            Send a file. Leave no loose ends
          </h1>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/upload">
              <button className="btn-primary">
                Choose a file
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            </Link>
            <span className="text-muted font-mono text-xs">No account required</span>
          </div>
        </div>

        <div className="transfer-receipt min-h-[336px] p-6 sm:p-8">
          <div className="hairline flex items-center justify-between border-b pb-5">
            <div className="flex items-center gap-3">
              <span className="text-accent hairline grid h-9 w-9 place-items-center rounded-lg border">
                <Upload size={18} strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-sm font-medium">Quarterly-report.pdf</p>
                <p className="text-muted mt-1 font-mono text-xs">8.4 MB · ready</p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#67d8cc]" aria-label="Ready" />
          </div>

          <div className="text-primary grid grid-cols-3 gap-4 py-6">
            <div>
              <p className="text-muted text-xs">Expires</p>
              <p className="mt-2 font-mono text-sm">24 hours</p>
            </div>
            <div>
              <p className="text-muted text-xs">Downloads</p>
              <p className="mt-2 font-mono text-sm">3 left</p>
            </div>
            <div>
              <p className="text-muted text-xs">Protected</p>
              <p className="mt-2 font-mono text-sm">Yes</p>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <p className="text-muted text-xs">Transfer</p>
              <p className="text-accent mt-1 font-mono text-sm">DL-7F2A</p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-[#f4f6f3] text-[#171917]">
              <QrCode size={36} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>

      <section className="hairline mt-20 grid gap-px overflow-hidden rounded-2xl border md:grid-cols-3">
        <div className="surface-page p-6">
          <LockKeyhole size={18} strokeWidth={1.5} className="text-accent" />
          <h2 className="text-primary mt-4 text-sm font-medium">Password optional</h2>
          <p className="text-muted mt-2 text-sm leading-6">Add a password before creating the transfer</p>
        </div>
        <div className="surface-page p-6">
          <Clock3 size={18} strokeWidth={1.5} className="text-accent" />
          <h2 className="text-primary mt-4 text-sm font-medium">Timed availability</h2>
          <p className="text-muted mt-2 text-sm leading-6">Set the window in minutes</p>
        </div>
        <div className="surface-page p-6">
          <QrCode size={18} strokeWidth={1.5} className="text-accent" />
          <h2 className="text-primary mt-4 text-sm font-medium">Link or QR</h2>
          <p className="text-muted mt-2 text-sm leading-6">Share one transfer on any screen</p>
        </div>
      </section>
    </div>
  );
};
