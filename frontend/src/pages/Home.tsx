import { UploadCard } from '../components/UploadCard';

export const Home = () => {
  return (
    <div className="flex w-full max-w-6xl flex-1 items-center py-10 sm:py-16">
      <section className="grid w-full items-center gap-12 lg:grid-cols-[1fr_460px]">
        <div className="max-w-xl">
          <p className="text-accent mb-5 text-sm font-medium">Temporary file transfer</p>
          <h1 className="text-primary max-w-lg text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            Send a file. Leave no loose ends
          </h1>
          <p className="text-secondary mt-5 max-w-md text-base leading-7">
            Upload once, add an optional password, expiry timer, or download limit, and share a link or QR code.
          </p>
          <p className="text-muted mt-8 font-mono text-xs">
            100 MB max · Argon2 protection · Auto-expiring links · Image &amp; PDF preview
          </p>
        </div>

        <UploadCard />
      </section>
    </div>
  );
};
