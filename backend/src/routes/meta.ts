import { FastifyInstance } from 'fastify';
import prisma from '../services/db';

export default async function metaRoutes(fastify: FastifyInstance) {
  fastify.get('/departments', async () => {
    return prisma.department.findMany({
      include: { positions: true }
    });
  });

  fastify.get('/positions', async (req) => {
    const { departmentId } = req.query as { departmentId?: string };
    if (!departmentId) return [];
    return prisma.position.findMany({
      where: { departmentId: Number(departmentId) }
    });
  });

  fastify.get('/interviewStatus', async (req, reply) => {
    const { interviewId } = req.query as { interviewId?: string };
    if (!interviewId) return reply.status(400).send({ error: "interviewId gerekli" });

    const interview = await prisma.interview.findUnique({
        where: { interviewId }
    });

    if (!interview) return reply.status(404).send({ error: "Interview not found" });

    return { status: interview.status };
  });
}