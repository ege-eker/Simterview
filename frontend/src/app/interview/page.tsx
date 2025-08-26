"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  VideoConference,
  PreJoin,
} from "@livekit/components-react";
import "@livekit/components-styles";

export default function InterviewRoom() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");
  const identity = searchParams.get("identity");
  const apiUrl = process.env.NEXT_PUBLIC_PUBLIC_API_URL;

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | undefined>(undefined);
  const [preJoin, setPreJoin] = useState(true);

  // get token from backend
  useEffect(() => {
    if (interviewId && identity) {
      fetch(`${apiUrl}/livekit/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, identity }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("🎟️ LiveKit Token Payload:", data);
          setToken(data.token);
          setServerUrl(data.url);
        })
        .catch((err) => console.error("Token fetch error", err));
    }
  }, [interviewId, identity]);

  if (!token || !serverUrl) {
    return <p>🔄 Loading LiveKit token...</p>;
  }

  if (preJoin) {
    return (
      <PreJoin
        onSubmit={() => setPreJoin(false)}
        defaults={{
          username: identity ?? "user",
          audioEnabled: true,
          videoEnabled: true,
        }}
      />
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={true}
      audio={{
    autoGainControl: true,
    noiseSuppression: true,
    echoCancellation: true,
  }}
      style={{ height: "100vh" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}