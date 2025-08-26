import { FastifyInstance } from 'fastify';
import { protokolAuth } from "../middlewares/protokolAuth";
import prisma from '../services/db';
import { createParticipantToken, LIVEKIT_URL } from "../services/livekit";

export default async function protokolRoutes(fastify: FastifyInstance) {
    fastify.post("/session", {preHandler: protokolAuth}, async (req, reply) => {
        const {protokolId, promptKey} = req.body as { protokolId: string, promptKey: string };

        const session = await prisma.protokolSession.create({
            data: {protokolId, promptKey},
        });

        const token = createParticipantToken(session.id.toString(), `protokol-${session.id}`);

        return {session, livekit: {url: LIVEKIT_URL, token}};
    });
}