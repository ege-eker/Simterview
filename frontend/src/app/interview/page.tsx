"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  ParticipantTile,
  GridLayout,
  RoomAudioRenderer,
  ControlBar,
  useTracks
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

function SimliOnlyVideo() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false }
  ]);
  return (
    <GridLayout tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}

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
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={() => router.push("/")}
      style={{ height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "center",
          alignItems: "center",
          backgroundColor: darkMode ? "#1a1a1a" : "white",
          position: "relative",
      }}
    >
        <button style={{
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
        }} onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "🌞" : "🌙"}
        </button>
      <div style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          padding: "1rem",
          color: "white",
      }}>
          <SimliOnlyVideo/>
      </div>
      <RoomAudioRenderer />
      <div style={{ display: "flex", justifyContent: "center", padding: "1rem", color: darkMode ? "white" : "black" }}>
        <ControlBar
          variation="minimal"
          controls={{
            microphone: true,
            camera: false,
            leave: true
          }}
        />
      </div>
    </LiveKitRoom>
  );
}