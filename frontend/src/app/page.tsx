"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();
  const [lastName, setLastName] = useState("");
  const [interviewId, setInterviewId] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_PUBLIC_API_URL;

  const handleStart = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${apiUrl}/candidates/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastName, interviewId }),
      }).then((r) => r.json());

      if (resp.error) {
        alert(resp.error);
        setLoading(false);
        return;
      }

      // Başarılı ise interview sayfasına yönlendir
      router.push(
        `/interview?interviewId=${encodeURIComponent(
          interviewId
        )}&identity=${encodeURIComponent(lastName)}`
      );
    } catch (err) {
      console.error(err);
      alert("Interview başlatılırken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Interview Join</h1>
      <input
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <br />
      <input
        placeholder="Interview ID"
        value={interviewId}
        onChange={(e) => setInterviewId(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <br />
      <button
        onClick={handleStart}
        disabled={!lastName || !interviewId || loading}
      >
        {loading ? "Starting..." : "Join Interview"}
      </button>
    </div>
  );
}