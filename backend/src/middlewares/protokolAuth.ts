import { FastifyReply, FastifyRequest } from 'fastify';

export function protokolAuth(req: FastifyRequest, res: FastifyReply, done: Function) {
    const key = req.headers["x-protocol-key"];
    if (key !== process.env.PROTOCOL_KEY) {
        res.status(401).send({ error: "Unauthorized" });
        return;
    }
    done();
}