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
}