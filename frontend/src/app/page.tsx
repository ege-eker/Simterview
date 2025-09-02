"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const [interviewId, setInterviewId] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnterInterview = async () => {
    if (!interviewId || !lastName) {
      alert("Kod ve soyad gerekli");
      return;
    }

    // basic validation
    if (!/^\d{6}$/.test(interviewId)) {
      alert("Interview kodu 6 haneli sayılardan oluşmalı.");
      return;
    }
    if (!/^[A-Za-zĞÜŞİÖÇğüşıöç\s]+$/.test(lastName)) {
      alert("Soyad yalnızca harf olmalı.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_PUBLIC_API_URL;
      const resp = await fetch(`${apiUrl}/candidates/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastName, interviewId }),
      });
      const data = await resp.json();

      if (data.error) {
        alert("❌ Hata: " + data.error);
        setLoading(false);
        return;
      }

      console.log("Interview started:", data);

      // room ready, redirect
      router.push(`/interview?interviewId=${interviewId}&identity=${lastName}`);
    } catch (err) {
      console.error(err);
      alert("Sunucuya bağlanılamadı!");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "400px",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "1rem", color: "#222" }}>🎤 Mülakat Girişi</h1>
        <input
          placeholder="Mülakat Kodu"
          value={interviewId}
          onChange={(e) => setInterviewId(e.target.value)}
          style={{
            width: "100%",
            marginBottom: "0.8rem",
            padding: "0.7rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />
        <input
          placeholder="Soyadınız"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={{
            width: "100%",
            marginBottom: "1rem",
            padding: "0.7rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />

        <button
          onClick={handleEnterInterview}
          disabled={loading}
          style={{
            background: loading ? "#93c5fd" : "#2563eb",
            color: "white",
            padding: "0.7rem 1.2rem",
            borderRadius: "8px",
            width: "100%",
            border: "none",
            cursor: loading ? "wait" : "pointer",
            marginBottom: "0.8rem",
          }}
        >
          {loading ? "🔄 Oda hazırlanıyor..." : "➡️ Mülakata Katıl"}
        </button>

        <button
          onClick={() => router.push("/apply")}
          style={{
            background: "#10b981",
            color: "white",
            padding: "0.7rem 1.2rem",
            borderRadius: "8px",
            width: "100%",
            border: "none",
            cursor: "pointer",
            marginBottom: "0.3rem",
          }}
        >
          📝 Kayıt Ol
        </button>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "12px",
          right: "20px",
          fontSize: "0.9rem",
          color: "#888",
          cursor: "pointer",
        }}
        onClick={() => router.push("/admin")}
        title="Admin Panel"
      >
        ⚙️
      </div>
    </div>
  );
}