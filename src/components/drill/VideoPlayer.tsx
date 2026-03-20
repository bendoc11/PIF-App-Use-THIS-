interface VideoPlayerProps {
  muxPlaybackId?: string | null;
  vimeoId?: string | null;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  loop?: boolean;
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
  const hasMux = !!muxPlaybackId && muxPlaybackId.trim().length > 0;
  const hasVimeo = !!vimeoId && vimeoId.trim().length > 0 && !hasMux;

  console.log("[VideoPlayer] muxPlaybackId:", muxPlaybackId, "| vimeoId:", vimeoId, "| using:", hasMux ? "MUX" : hasVimeo ? "VIMEO" : "NONE");

  if (hasMux) {
    const muxParams = new URLSearchParams();
    if (title) muxParams.set("metadata-video-title", title);
    if (autoPlay) muxParams.set("autoplay", "muted");
    if (loop) muxParams.set("loop", "");
    return (
      <div className={className} style={{ position: "relative", width: "100%", paddingTop: "56.25%", ...style }}>
        <iframe
          ref={iframeRef}
          src={`https://stream.mux.com/${muxPlaybackId}?${muxParams.toString()}`}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", pointerEvents: "none" }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (hasVimeo) {
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
