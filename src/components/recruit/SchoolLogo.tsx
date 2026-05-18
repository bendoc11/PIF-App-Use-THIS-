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
  useEffect(() => setIdx(0), [candidates.join("|")]);

  const src = candidates[idx];
  const dimStyle = { width: size, height: size, borderRadius: radius };

  if (!src) {
    return (
      <div
        className="flex items-center justify-center text-white font-semibold shrink-0"
        style={{ ...dimStyle, fontFamily: SF, background: "#0F1A2E", fontSize: Math.round(size * 0.42) }}
      >
        {(name || "?").charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className="overflow-hidden shrink-0 flex items-center justify-center"
      style={{ ...dimStyle, background: "rgba(255,255,255,0.05)" }}
    >
      <img
        src={src}
        alt={`${name} logo`}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}
