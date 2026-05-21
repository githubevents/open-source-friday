import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type GuestPromoProps = {
  guest_name: string;
  github_handle: string;
  project_name: string;
  project_url: string;
  bio: string;
  stream_date: string;
  stream_time: string;
  host_name: string;
  has_audio: boolean;
};

export const GuestPromo: React.FC<GuestPromoProps> = ({
  guest_name,
  github_handle,
  project_name,
  stream_date,
  stream_time,
  host_name,
  has_audio,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, from: 0, to: 1, config: { damping: 20 } });

  const guestOpacity = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const guestY = spring({
    frame: frame - 60,
    fps,
    from: 60,
    to: 0,
    config: { damping: 18 },
  });

  const projectOpacity = interpolate(frame, [150, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dateOpacity = interpolate(frame, [240, 280], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [330, 370], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0d1117",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {has_audio && <Audio src={staticFile("narration.mp3")} />}

      {/* Accent bar top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: "linear-gradient(90deg, #238636 0%, #58a6ff 100%)",
          opacity: titleOpacity,
        }}
      />

      {/* Header: GitHub / Open Source Friday */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontSize: 26,
            color: "#7d8590",
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          GitHub
        </div>
        <div
          style={{
            fontSize: 54,
            color: "#ffffff",
            fontWeight: 800,
            marginTop: 6,
            letterSpacing: -1,
          }}
        >
          Open Source Friday
        </div>
        <div
          style={{
            width: 72,
            height: 4,
            backgroundColor: "#238636",
            margin: "18px auto 0",
            borderRadius: 2,
          }}
        />
      </div>

      {/* Guest name + handle */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 80,
          right: 80,
          opacity: guestOpacity,
          transform: `translateY(${guestY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 78,
            color: "#ffffff",
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          {guest_name}
        </div>
        {github_handle && (
          <div style={{ fontSize: 34, color: "#58a6ff", marginTop: 10 }}>
            @{github_handle}
          </div>
        )}
      </div>

      {/* Talking about + project */}
      <div
        style={{
          position: "absolute",
          top: 540,
          left: 80,
          right: 80,
          opacity: projectOpacity,
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "#7d8590",
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          Talking about
        </div>
        <div
          style={{
            fontSize: 50,
            color: "#3fb950",
            fontWeight: 700,
            marginTop: 8,
            lineHeight: 1.2,
          }}
        >
          {project_name}
        </div>
      </div>

      {/* Date + host */}
      <div
        style={{
          position: "absolute",
          top: 720,
          left: 80,
          right: 80,
          opacity: dateOpacity,
        }}
      >
        <div style={{ fontSize: 42, color: "#ffffff", fontWeight: 600 }}>
          📅 {stream_date} · {stream_time}
        </div>
        {host_name !== "TBD" && (
          <div style={{ fontSize: 28, color: "#7d8590", marginTop: 8 }}>
            with {host_name}
          </div>
        )}
      </div>

      {/* CTA footer */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          right: 80,
          opacity: ctaOpacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 26, color: "#58a6ff" }}>
          youtube.com/@GitHubEvents
        </div>
        <div
          style={{
            backgroundColor: "#238636",
            color: "#ffffff",
            fontSize: 24,
            fontWeight: 700,
            padding: "14px 36px",
            borderRadius: 8,
          }}
        >
          Watch Live
        </div>
      </div>

      {/* Accent bar bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #58a6ff 0%, #238636 100%)",
          opacity: ctaOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
