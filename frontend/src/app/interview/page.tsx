"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";
import "@livekit/components-styles";
import InterviewWaveform from "@/components/InterviewWaveform";

export default function InterviewRoom() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");
  const identity = searchParams.get("identity");
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | undefined>(undefined);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (interviewId && identity) {
      fetch("http://localhost:4000/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, identity }),
      })
        .then((res) => res.json())
        .then((data) => {
          setToken(data.token);
          setServerUrl(data.url);
        });
    }
  }, [interviewId, identity]);

  if (!token || !serverUrl) return <p>LiveKit token alınıyor...</p>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: darkMode ? "#0a0a0a" : "#f9fafb",
      }}
    >
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={() => router.push("/")}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Dark/Light Toggle */}
        <button
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 10,
            padding: "0.5rem 1rem",
            backgroundColor: darkMode ? "#444" : "#ddd",
            color: darkMode ? "white" : "black",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "🌞" : "🌙"}
        </button>

        {/* waveform */}
        <InterviewWaveform centerIcon={"logo.svg"}/>
        <RoomAudioRenderer />

        {/* Control Bar */}
        <div style={{ padding: "1rem", color: darkMode ? "white" : "black" }}>
          <ControlBar
            variation="minimal"
            controls={{
              microphone: true,
              camera: false,
              leave: true,
            }}
          />
        </div>
      </LiveKitRoom>

      {/* Footer */}
      <footer style={{ width: "100%", overflow: "hidden" }}>
        <img
          src="/footer.jpg"
          alt="Footer"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            objectFit: "cover",
          }}
        />
      </footer>
    </div>
  );
}