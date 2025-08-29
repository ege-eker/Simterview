"use client";

import { useEffect, useState } from "react";
import { promptSamples } from "@/lib/promptSamples";

interface Position {
  id: number;
  title: string;
  departmentId: number;
}

interface Department {
  id: number;
  name: string;
  positions: Position[];
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [secretInput, setSecretInput] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDept, setNewDept] = useState("");
  const [newPos, setNewPos] = useState("");
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [selectedPos, setSelectedPos] = useState<number | null>(null);

  // AUTH
  const handleLogin = async () => {
    if (!secretInput.trim()) {
      alert("Secret required!");
      return;
    }

    // test req to backend
    const res = await fetch("http://localhost:4000/admin/departments", {
      headers: { "x-protocol-key": secretInput },
    });
    if (res.status === 401) {
      alert("❌ Hatalı Secret");
      return;
    }

    setAuthorized(true);
    await fetchDepartments(secretInput);
  };

  const fetchDepartments = async (secret: string) => {
    const res = await fetch("http://localhost:4000/admin/departments", {
      headers: { "x-protocol-key": secret },
    });
    const data = await res.json();
    setDepartments(data);
  };

  const addDepartment = async () => {
    if (!newDept.trim()) return alert("Departman adı boş olamaz");
    const res = await fetch("http://localhost:4000/admin/departments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-protocol-key": secretInput,
      },
      body: JSON.stringify({ name: newDept }),
    });
    const dept: Department = await res.json();
    setDepartments([...departments, { ...dept, positions: [] }]);
    setNewDept("");
  };

  const addPosition = async () => {
    if (!selectedDept || !newPos.trim()) return alert("Pozisyon girin");
    const res = await fetch("http://localhost:4000/admin/positions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-protocol-key": secretInput,
      },
      body: JSON.stringify({ title: newPos, departmentId: selectedDept }),
    });
    const pos: Position = await res.json();
    setDepartments(
      departments.map((d) =>
        d.id === selectedDept ? { ...d, positions: [...d.positions, pos] } : d
      )
    );
    setNewPos("");
  };

  const addPrompt = async () => {
    if (!selectedPos || !newPrompt.trim()) return alert("Prompt boş olamaz");
    const res = await fetch("http://localhost:4000/admin/prompts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-protocol-key": secretInput,
      },
      body: JSON.stringify({ positionId: selectedPos, promptTemplate: newPrompt }),
    });
    await res.json();
    alert("✅ Prompt kaydedildi");
    setNewPrompt("");
  };

  if (!authorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f9fafb",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: "400px",
            textAlign: "center",
          }}
        >
          <h2>🔒 Admin Panel Girişi</h2>
          <input
            type="password"
            placeholder="Protocol Secret"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            style={{
              width: "100%",
              marginTop: "1rem",
              padding: "0.7rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              marginTop: "1rem",
              background: "#2563eb",
              color: "white",
              padding: "0.7rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // ✅ Admin Panel UI
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "2rem",
          width: "700px",
        }}
      >
        <h1 style={{ marginBottom: "1rem", color: "#111" }}>⚙️ Admin Paneli</h1>

        {/* Departman Ekle */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>Departman Ekle</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              placeholder="Departman adı"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #ccc" }}
            />
            <button
              onClick={addDepartment}
              style={{
                background: "#2563eb",
                color: "white",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              + Ekle
            </button>
          </div>
        </section>

        {/* Pozisyon Ekle */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>Pozisyon Ekle</h2>
          <select
            onChange={(e) => setSelectedDept(Number(e.target.value))}
            defaultValue=""
            style={{ width: "100%", marginBottom: "0.5rem", padding: "0.6rem" }}
          >
            <option value="" disabled>
              Departman seç...
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              placeholder="Pozisyon adı"
              value={newPos}
              onChange={(e) => setNewPos(e.target.value)}
              style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #ccc" }}
            />
            <button
              onClick={addPosition}
              style={{
                background: "#10b981",
                color: "white",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              + Ekle
            </button>
          </div>
        </section>

        {/* Prompt Ekle */}
        <section>
          <h2>Prompt Ekle</h2>
          {selectedDept && (
            <select
              onChange={(e) => setSelectedPos(Number(e.target.value))}
              defaultValue=""
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.6rem" }}
            >
              <option value="" disabled>
                Pozisyon seç...
              </option>
              {departments
                .find((d) => d.id === selectedDept)
                ?.positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
          )}
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val && promptSamples[val]) setNewPrompt(promptSamples[val]);
            }}
            defaultValue=""
            style={{ width: "100%", marginBottom: "0.5rem", padding: "0.6rem" }}
          >
            <option value="">Örnek Prompt Seç...</option>
            <option value="backend">Backend Sample</option>
            <option value="frontend">Frontend Sample</option>
            <option value="qa">QA Sample</option>
          </select>
          <textarea
            placeholder="Prompt metni"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            rows={8}
            style={{
              width: "100%",
              marginTop: "0.5rem",
              padding: "0.8rem",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={addPrompt}
            style={{
              marginTop: "1rem",
              background: "#f59e0b",
              color: "white",
              padding: "0.7rem 1.2rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              width: "100%",
            }}
          >
            📌 Kaydet
          </button>
        </section>
      </div>
    </div>
  );
}