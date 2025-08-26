import { FastifyInstance } from 'fastify';
import { createParticipantToken, LIVEKIT_URL } from "../services/livekit";

export default async function livekitRoutes(fastify: FastifyInstance) {
    fastify.post("/token", async (req,reply) => {
        const {interviewId, identity} = req.body as {interviewId: string, identity: string};
        if(!interviewId || !identity) {
            return reply.status(400).send({error: "Missing interviewId or identity"});
        }

        const token = await createParticipantToken(interviewId, identity);
        console.log("🎫 Generated Token:", token);
        return { url: LIVEKIT_URL, token };
    })
}