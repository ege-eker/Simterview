import { FastifyInstance } from 'fastify';
import prisma from '../services/db';
import { roomService } from "../services/livekit";
import { Room } from 'livekit-server-sdk';
import {sendInterviewCodeMail} from "../services/mail";

export default async function candidatesRoutes(fastify: FastifyInstance) {
  // Candidate register
  fastify.post("/", async (req) => {
    const { firstName, lastName, email, phone, resume, positionId } = req.body as any;

    const candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        resume,
        positionId,
      },
    });

    async function generateUniqueInterviewCode(length: number = 6): Promise<string> {
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;

      let code: string;
      let exists = true; // check database for uniqueness

      while (exists) {
        code = Math.floor(Math.random() * (max - min + 1) + min).toString();

        const check = await prisma.interview.findUnique({
          where: { interviewId: code },
        });

        exists = !!check;
      }

      return code!;
    }

    const uniqueCode = await generateUniqueInterviewCode();

    const interview = await prisma.interview.create({
      data: {
        candidateId: candidate.id,
        interviewId: uniqueCode,
      },
    });

    if (candidate.email) {
        try {
            await sendInterviewCodeMail(candidate.email, uniqueCode);
            console.log(`📧 Interview code email sent to ${candidate.email}, interviewId: ${uniqueCode}`);
        }
        catch (err) {
            console.log("⚠️ Could not send interview code email:", err);
        }
    }

    return { candidate, interview };
});

  fastify.post("/start", async (req, reply) => {
      const  { lastName, interviewId } = req.body as { lastName: string, interviewId: string };

      const interview = await prisma.interview.findUnique({
        where: { interviewId },
        include: {
          candidate: { include: { position: { include: { department: true, interviewPrompts: true } } } },
        },
      });

      if (!interview) return reply.status(404).send({ error: "Interview not found" });
      if (interview.candidate.lastName.toLowerCase() !== lastName.toLowerCase()) {
          return reply.status(401).send({error: "unauthorized"});
      }

      await prisma.interview.update({
          where: {id: interview.id},
          data: { status: "started", startedAt: new Date()},
      });

      // get prompt template from position or use default
      const promptTemplate = interview.candidate.position.interviewPrompts[0]?.promptTemplate
        || `Varsayılan mülakat promptu...`;

      const prompt = promptTemplate
        .replace("{firstName}", interview.candidate.firstName)
        .replace("{lastName}", interview.candidate.lastName)
        .replace("{position}", interview.candidate.position.title)
        .replace("{department}", interview.candidate.position.department.name)
        .replace("{resume}", interview.candidate.resume ?? "CV boş, adaydan detay iste");

      const roomOpts = {
        name: interviewId,
        emptyTimeout: 298,
        maxParticipants: 10,
        metadata: JSON.stringify({ prompt }),
        videoCodecs: "vp8",
      }

      try {
          await roomService.createRoom(roomOpts).then((room: Room) => {
            console.log(`✅Room created: ${room.name} with SID: ${room.sid} and metadata: ${room.metadata}, max partitipants: ${room.maxParticipants}, emptyTO:${room.emptyTimeout}`, room);
          });
          console.log(`✅ Room created with metadata for interview ${interviewId}`);
        } catch (err: any) {
          if (err.message.includes("Room already exists")) {
            console.log("⚠️ Room already exists, updating metadata...");
            const updated = await roomService.updateRoomMetadata(interviewId, JSON.stringify({ prompt }))
            console.log("Updated metadata:", updated.metadata)
          } else {
            throw err;
          }
      }


      console.log(`Room created for interview ${interviewId}, prompt: ${prompt}`);

      return { message: "Interview started", interview, prompt };
  });

  fastify.post("/finish", async (req, reply) => {
    const { interviewId } = req.body as { interviewId: string };

    if (!interviewId) return reply.status(400).send({ error: "interviewId gerekli" });

    const interview = await prisma.interview.findUnique({ where: { interviewId } });
    if (!interview) return reply.status(404).send({ error: "Interview bulunamadı" });

    const updated = await prisma.interview.update({
        where: { interviewId },
        data: { status: "finished", finishedAt: new Date() }
    })
    console.log(`✅ Interview ${interviewId} finished at ${updated.finishedAt}`);
    return { message: "✅ Interview finished, user updated", interview: updated };
    });
}