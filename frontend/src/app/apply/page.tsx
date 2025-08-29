"use client";

import { useEffect, useState } from "react";

interface Department {
  id: number;
  name: string;
}
interface Position {
  id: number;
  title: string;
  departmentId: number;
}

export default function CandidateApplyPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resume, setResume] = useState("");

  const [interviewCode, setInterviewCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:4000/meta/departments")
      .then((res) => res.json())
      .then((data: Department[]) => setDepartments(data));
  }, []);

  const loadPositions = async (deptId: number) => {
    setSelectedDept(deptId);
    const res = await fetch(
      `http://localhost:4000/meta/positions?departmentId=${deptId}`
    );
    setPositions(await res.json());
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !selectedPos) {
      alert("Zorunlu alanları doldurun!");
      return;
    }

    const body = {
      firstName,
      lastName,
      email,
      phone,
      resume,
      positionId: selectedPos
    };

    const res = await fetch("http://localhost:4000/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    setInterviewCode(data.interview.interviewId);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          width: "600px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <h1 style={{ marginBottom: "1rem", color: "#111" }}>
          📝 Aday Kayıt Formu
        </h1>

        <div style={{ marginBottom: "1rem", display: "grid", gap: "0.5rem" }}>
          <input
            placeholder="Ad"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            placeholder="Soyad"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <textarea
            placeholder="Özgeçmiş (CV)"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={5}
          />
        </div>

        <h3>Departman Seç</h3>
        <select
          onChange={(e) => loadPositions(Number(e.target.value))}
          defaultValue=""
          style={{ marginBottom: "1rem" }}
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

        {positions.length > 0 && (
          <>
            <h3>Pozisyon Seç</h3>
            <select
              onChange={(e) => setSelectedPos(Number(e.target.value))}
              defaultValue=""
            >
              <option value="" disabled>
                Pozisyon seç...
              </option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </>
        )}

        <br />
        <button
          onClick={handleSubmit}
          style={{
            marginTop: "1rem",
            background: "#2563eb",
            color: "white",
            padding: "0.7rem 1.2rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            width: "100%"
          }}
        >
          ✅ Kaydı Gönder
        </button>

        {interviewCode && (
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "#ecfdf5",
              borderRadius: "10px",
              border: "1px solid #10b981"
            }}
          >
            <h2>Başvuru Başarılı 🎉</h2>
            <p>
              Mülakat Kodunuz:{" "}
              <b style={{ color: "#065f46" }}>{interviewCode}</b>
            </p>
            <p>Bu kod ile mülakata giriş yapabilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}