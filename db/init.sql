-- enable uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- candidates
CREATE TABLE "candidates" (
    "id" SERIAL PRIMARY KEY,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100),
    "phone" VARCHAR(20),
    "department" VARCHAR(100),
    "position" VARCHAR(100) NOT NULL,
    "company" VARCHAR(100),
    "resume" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- interviews
CREATE TABLE "interviews" (
    "id" SERIAL PRIMARY KEY,
    "interviewId" UUID DEFAULT gen_random_uuid(),
    "candidateId" INT NOT NULL REFERENCES "candidates"("id") ON DELETE CASCADE,
    "status" VARCHAR(20) DEFAULT 'pending',
    "startedAt" TIMESTAMP,
    "finishedAt" TIMESTAMP
);

-- protocol_sessions
CREATE TABLE "protokolSessions" (
    "id" SERIAL PRIMARY KEY,
    "protokolId" VARCHAR(50) NOT NULL,
    "promptKey" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);