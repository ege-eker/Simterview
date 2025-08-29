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
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <div style={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <SimliOnlyVideo />
      </div>
      <RoomAudioRenderer />
      <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
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