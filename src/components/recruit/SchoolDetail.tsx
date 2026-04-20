import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, GraduationCap, MapPin, Users, Twitter, Instagram, Phone, Mail } from "lucide-react";
import { MockCoach, MockSchool, DIVISION_COLORS } from "@/data/mockSchools";

interface Props {
  school: MockSchool;
  onBack: () => void;
  onCompose: (coaches: MockCoach[]) => void;
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
      className="inline-flex items-center justify-center h-7 w-7 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
    >
      {children}
    </a>
  );
}

function buildSocialUrl(handle: string | undefined, platform: "twitter" | "instagram"): string | null {
  if (!handle) return null;
  const v = handle.trim();
  if (!v) return null;
  if (v.startsWith("http")) return v;
  const cleaned = v.replace(/^@/, "");
  return platform === "twitter"
    ? `https://twitter.com/${cleaned}`
    : `https://instagram.com/${cleaned}`;
}

export function SchoolDetail({ school, onBack, onCompose }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const toggle = (email: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const selectedCoaches = school.coaches.filter((c) => picked.has(c.email));
  const teamTwitter = buildSocialUrl(school.teamTwitter, "twitter");
  const teamInstagram = buildSocialUrl(school.teamInstagram, "instagram");

  return (
    <Card className="p-6 bg-white border-gray-200">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to map
      </Button>

      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-semibold text-gray-900">{school.name}</h2>
            <div className="flex items-center gap-0.5">
              {teamTwitter && (
                <SocialIcon href={teamTwitter} label={`${school.name} on X`}>
                  <Twitter className="h-4 w-4" />
                </SocialIcon>
              )}
              {teamInstagram && (
                <SocialIcon href={teamInstagram} label={`${school.name} on Instagram`}>
                  <Instagram className="h-4 w-4" />
                </SocialIcon>
              )}
            </div>
          </div>
          <Badge
            style={{ backgroundColor: DIVISION_COLORS[school.division], color: "white" }}
            className="border-0"
          >
            {school.division}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{school.city}, {school.state}</span>
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {school.avgGpa != null ? `${school.avgGpa.toFixed(2)} avg GPA` : school.academicLevel}
          </span>
          {school.enrollment > 0 && (
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{school.enrollment.toLocaleString()} ({school.size})</span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Coaching staff ({school.coaches.length})
      </h3>
      <div className="space-y-2 mb-5">
        {school.coaches.map((c, i) => {
          const tw = buildSocialUrl(c.twitter, "twitter");
          const ig = buildSocialUrl(c.instagram, "instagram");
          return (
            <label
              key={`${c.email}-${i}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={picked.has(c.email)}
                onCheckedChange={() => toggle(c.email)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {tw && (
                    <SocialIcon href={tw} label={`${c.name} on X`}>
                      <Twitter className="h-3.5 w-3.5" />
                    </SocialIcon>
                  )}
                  {ig && (
                    <SocialIcon href={ig} label={`${c.name} on Instagram`}>
                      <Instagram className="h-3.5 w-3.5" />
                    </SocialIcon>
                  )}
                </div>
                <p className="text-xs text-gray-500">{c.title}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {c.email}
                  </span>
                  {c.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <Button
        disabled={selectedCoaches.length === 0}
        onClick={() => onCompose(selectedCoaches)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        Add {selectedCoaches.length} coach{selectedCoaches.length !== 1 ? "es" : ""} to outreach
      </Button>
    </Card>
  );
}
