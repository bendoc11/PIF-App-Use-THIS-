import MuxPlayer from "@mux/mux-player-react";
import { useRef } from "react";

interface VideoPlayerProps {
  muxPlaybackId?: string | null;
  vimeoId?: string | null;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  loop?: boolean;
  /** For Vimeo iframe ref (used by mobile tap-to-pause) */
  iframeRef?: React.RefObject<HTMLIFrameElement>;
}

export function VideoPlayer({
  muxPlaybackId,
  vimeoId,
  title,
  className = "w-full h-full",
  style,
  autoPlay = false,
  loop = false,
  iframeRef,
}: VideoPlayerProps) {
  console.log("[VideoPlayer] muxPlaybackId:", muxPlaybackId, "| vimeoId:", vimeoId, "| title:", title);

  if (muxPlaybackId) {
    return (
      <MuxPlayer
        playbackId={muxPlaybackId}
        metadata={{ video_title: title }}
        style={{ width: "100%", aspectRatio: "16/9", ...style }}
        autoPlay={autoPlay ? "muted" : false}
        loop={loop}
        playsInline
        className={className}
        onError={(e: any) => console.error("[MuxPlayer] error:", e?.detail || e)}
      />
    );
  }

  if (vimeoId) {
    const params = `color=E8453C&title=0&byline=0&portrait=0&background=0${autoPlay ? "&autoplay=1" : ""}${loop ? "&loop=1" : ""}`;
    return (
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${vimeoId}?${params}`}
        className={className}
        style={style}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-muted ${className}`} style={style}>
      <span className="text-muted-foreground text-sm">Video not available</span>
    </div>
  );
}
