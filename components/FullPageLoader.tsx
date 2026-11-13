export function FullPageLoader({ label = "LOADING…" }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-night text-mist">
      <div className="flex items-center gap-3 font-mono text-xs tracking-widest">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-signal" />
        {label}
      </div>
    </div>
  );
}
