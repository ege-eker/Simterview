import Fastify from 'fastify'
import * as dotenv from 'dotenv'
import fastifyCors from '@fastify/cors'

dotenv.config()

import livekitRoutes from './routes/livekit'
import candidatesRoutes from './routes/candidates'
import protokolRoutes from './routes/protokol'

const server = Fastify({ logger: true })

server.register(fastifyCors, { origin: true })

// Routes
server.register(livekitRoutes, { prefix: '/livekit' })
server.register(candidatesRoutes, { prefix: '/candidates' })
server.register(protokolRoutes, { prefix: '/protocol' })


const start = async () => {
    try {
        await server.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0"})
        const address = server.server.address();
        console.log(`🚀 Server listening on ${address.address}:${address.port}`);
    }
    catch (err) {
        console.error(err)
        process.exit(1)
    }
}

start();