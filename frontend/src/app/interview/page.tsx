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
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
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
  const [finished, setFinished] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_PUBLIC_API_URL;

  // LiveKit token al
  useEffect(() => {
    if (interviewId && identity) {
      fetch(`${apiUrl}/livekit/token`, {
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

  // Interview status poll
  useEffect(() => {
    if (!interviewId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`${apiUrl}/meta/interviewStatus?interviewId=${interviewId}`);
      const data = await res.json();
      if (data.status === "finished") {
        setFinished(true);
        clearInterval(interval);

        setTimeout(() => {
          router.push("/");
        }, 5000);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [interviewId]);

  if (finished) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <h1>✅ Mülakat Sona Ermiştir</h1>
        <p>Teşekkür ederiz. Ana sayfaya yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  if (!token || !serverUrl) return <p>LiveKit token alınıyor...</p>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
      options={{ adaptiveStream: false, dynacast: false }}
      onDisconnected={() => router.push("/")}
      style={{
        height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        backgroundColor: darkMode ? "#1a1a1a" : "white",
        position: "relative",
      }}
    >
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{ position: "absolute", top: "1rem", right: "1rem" }}
      >
        {darkMode ? "🌞" : "🌙"}
      </button>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <SimliOnlyVideo />
      </div>
      <RoomAudioRenderer />
      <ControlBar variation="minimal" controls={{ microphone: true, camera: false, leave: true }} />
    </LiveKitRoom>
  );
}