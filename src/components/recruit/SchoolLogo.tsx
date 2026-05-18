import { useEffect, useMemo, useState } from "react";

const SF = "'Plus Jakarta Sans', system-ui, sans-serif";

function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    const m = url.replace(/^https?:\/\//, "").split("/")[0];
    return m || null;
  }
}

function eduFromName(name: string): string | null {
  if (!name) return null;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return slug ? `${slug}.edu` : null;
}

interface Props {
  logoUrl?: string | null;
  rosterUrl?: string | null;
  name: string;
  size?: number;
  radius?: number;
}

export function SchoolLogo({ logoUrl, rosterUrl, name, size = 48, radius = 8 }: Props) {
  const candidates = useMemo(() => {
    const list: string[] = [];
    if (logoUrl) list.push(logoUrl);
    const dom = domainFromUrl(rosterUrl);
    if (dom) list.push(`https://logo.clearbit.com/${dom}`);
    const edu = eduFromName(name);
    if (edu) list.push(`https://logo.clearbit.com/${edu}`);
    return Array.from(new Set(list));
  }, [logoUrl, rosterUrl, name]);

  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIdx(0);
    setLoaded(false);
  }, [candidates.join("|")]);

  // 2-second timeout per candidate
  useEffect(() => {
    if (loaded) return;
    if (idx >= candidates.length) return;
    const t = window.setTimeout(() => {
      setIdx((i) => (i === idx ? i + 1 : i));
    }, 2000);
    return () => window.clearTimeout(t);
  }, [idx, loaded, candidates.length]);

  const dimStyle = { width: size, height: size, borderRadius: radius };

  const fallback = (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{
        ...dimStyle,
        background: "linear-gradient(135deg, #0B1220 0%, #1A2740 100%)",
        border: "1px solid rgba(255,255,255,0.20)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <span
        style={{
          fontFamily: SF,
          fontWeight: 700,
          color: "#FFFFFF",
          fontSize: Math.round(size * 0.46),
          lineHeight: 1,
        }}
      >
        {(name || "?").charAt(0).toUpperCase()}
      </span>
    </div>
  );

  const exhausted = idx >= candidates.length;
  if (exhausted) return fallback;

  const src = candidates[idx];
  return (
    <div
      className="shrink-0 relative overflow-hidden flex items-center justify-center"
      style={{
        ...dimStyle,
        background: loaded
          ? "rgba(255,255,255,0.05)"
          : "linear-gradient(135deg, #0B1220 0%, #1A2740 100%)",
        border: loaded ? "none" : "1px solid rgba(255,255,255,0.20)",
      }}
    >
      {!loaded && (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.00) 100%)",
          }}
        />
      )}
      <img
        src={src}
        alt={`${name} logo`}
        className="w-full h-full object-contain relative"
        loading="lazy"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 200ms" }}
        onLoad={(e) => {
          const img = e.currentTarget;
          // Some endpoints return a 1x1 transparent or tiny placeholder
          if (img.naturalWidth < 8 || img.naturalHeight < 8) {
            setIdx((i) => i + 1);
            return;
          }
          setLoaded(true);
        }}
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}
