"use client";
import React, { useEffect, useRef } from "react";
import { useTracks } from "@livekit/components-react";
import { Track, RemoteAudioTrack } from "livekit-client";

type Props = {
  centerIcon: string;
};

export default function InterviewWaveform({ centerIcon }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: false }]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const audioCtx = new window.AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let audioTrack: RemoteAudioTrack | undefined;
    tracks.forEach((pub) => {
      if (pub.publication?.track instanceof RemoteAudioTrack) {
        audioTrack = pub.publication.track as RemoteAudioTrack;
      }
    });

    if (audioTrack) {
      const stream = new MediaStream([audioTrack.mediaStreamTrack]);
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
    }

    let smoothed = 0;
    const colors = ["#00f5ff", "#00d9ff", "#8a2be2", "#ff00ff"];

    function draw() {
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const current = (avg / 255) * 2;
      smoothed = smoothed * 0.85 + current * 0.15;

      const bars = 120;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 320;

      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2;
        const color = colors[i % colors.length];

        const base = radius + Math.sin(Date.now() / 800 + i) * 10;
        const barHeight = base + smoothed * 120 * (0.5 + Math.random() * 0.5);

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * barHeight;
        const y2 = centerY + Math.sin(angle) * barHeight;

        ctx.strokeStyle = color;
        ctx.shadowBlur = 25;
        ctx.shadowColor = color;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    draw();

    return () => {
      audioCtx.close();
    };
  }, [tracks]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* big canvas */}
      <canvas
        ref={canvasRef}
        width={900}
        height={900}
        style={{ background: "transparent", position: "absolute" }}
      />
      {/* center icon */}
      <img
        src={centerIcon}
        alt="center-icon"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "280px",
          height: "280px",
          zIndex: 10,
          filter: "drop-shadow(0 0 25px rgba(0,255,255,0.8))",
        }}
      />
    </div>
  );
}