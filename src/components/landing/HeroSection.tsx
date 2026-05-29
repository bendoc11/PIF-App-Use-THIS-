import { SchoolBrowser } from "./SchoolBrowser";
import zacErvinHero from "@/assets/zac-ervin-hero.jpg";

const ZAC_AVATAR_URL =
  "https://feblgdfxkuegmjqsdycp.supabase.co/storage/v1/object/public/course-thumbnails/coaches/5c232b53-0334-49cf-81dd-5d94841a3bc4.png";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#0A0F1E" }}>
      {/* Full-bleed background photo */}
      <div className="absolute inset-0">
        <img
          src={zacErvinHero}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ background: "rgba(10,15,30,0.78)" }} />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.4) 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent, #0A0F1E)" }}
        />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-4 md:px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid lg:grid-cols-[55fr_45fr] gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN — product demonstration */}
          <div className="order-2 lg:order-1 animate-[fadeInUp_0.5s_ease-out_both]">
            <p
              className="font-semibold tracking-[0.12em] text-primary uppercase mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}
            >
              THE RECRUITING PLATFORM NCSA DOESN'T WANT YOU TO KNOW ABOUT
            </p>

            <h1 className="font-sans text-5xl sm:text-6xl lg:text-[4rem] font-bold leading-[1.05] mb-6 text-foreground">
              Get Offered.
            </h1>

            <p className="text-white/75 text-base sm:text-lg max-w-xl mb-5 leading-relaxed">
              Coaches recruited 4,200 athletes last year who reached out first. We give every high
              school basketball player direct access to every college coach in the country — and
              show you exactly which programs need your position right now.
            </p>

            <p
              className="mb-4"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 400,
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              👇 Browse programs below — tap one to get started
            </p>

            <div className="w-full max-w-[480px]">
              <SchoolBrowser />
            </div>
          </div>

          {/* RIGHT COLUMN — athlete profile / social proof */}
          <div className="order-1 lg:order-2 animate-[fadeInUp_0.6s_ease-out_both]">
            <AthleteProfileCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function AthleteProfileCard() {
  return (
    <div
      className="w-full max-w-[440px] mx-auto rounded-2xl overflow-hidden border"
      style={{
        background: "rgb(10, 15, 30)",
        borderColor: "rgba(255,255,255,0.15)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div className="relative w-full" style={{ height: 280 }}>
        <img
          src={ZAC_AVATAR_URL}
          alt="Zac Ervin, Elon University commit"
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent, rgb(10,15,30))" }}
        />
      </div>

      <div className="p-5">
        <p
          className="text-white leading-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20 }}
        >
          ZAC ERVIN
        </p>
        <p
          className="mt-1"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 400,
            fontSize: 13,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          SG/SF · 6'5" · Class of 2025
        </p>
        <p
          className="mt-1 text-primary"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13 }}
        >
          Elon University
        </p>

        <div className="my-4 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />

        <div className="grid grid-cols-3 gap-2">
          <StatBox value="40+" label="Scholarship Offers" valueColor="hsl(var(--primary))" />
          <StatBox value="#9" label="Ranked in Virginia" valueColor="#ffffff" />
          <StatBox value="D1" label="Division" valueColor="#ffffff" />
        </div>

        <div
          className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: "#0d2e1a", color: "#4ade80" }}
        >
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12 }}>
            ✓ Committed to Elon University
          </span>
        </div>

        <p
          className="mt-3 italic"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 400,
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.5,
          }}
        >
          Zac used Offered to contact coaches directly — and got offered.
        </p>
      </div>
    </div>
  );
}

function StatBox({
  value,
  label,
  valueColor,
}: {
  value: string;
  label: string;
  valueColor: string;
}) {
  return (
    <div
      className="rounded-lg p-2.5 text-center border"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: valueColor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        className="mt-1"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 500,
          fontSize: 10,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
