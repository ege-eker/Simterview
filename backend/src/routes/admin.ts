import { FastifyInstance } from "fastify";
import prisma from "../services/db";
import { protokolAuth } from "../middlewares/protokolAuth";

export default async function adminRoutes(fastify: FastifyInstance) {
  // protect all admin routes
  fastify.addHook("preHandler", (req, reply, done) => protokolAuth(req, reply, done));

  fastify.post("/departments", async (req) => {
    const body = req.body as { name: string };
    return prisma.department.create({ data: { name: body.name } });
  });

  fastify.get("/departments", async () => {
    return prisma.department.findMany({ include: { positions: true } });
  });

  fastify.post("/positions", async (req) => {
    const body = req.body as { title: string; departmentId: number };
    return prisma.position.create({ data: body });
  });

  fastify.post("/prompts", async (req) => {
    const body = req.body as { positionId: number; promptTemplate: string };
    return prisma.positionPrompt.create({ data: body });
  });
}