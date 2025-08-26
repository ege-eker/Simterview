import logging, os, json
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli
from livekit.plugins import openai, simli
from livekit.api import LiveKitAPI
from livekit.protocol.room import ListRoomsRequest
import asyncio


logging.basicConfig(level=logging.INFO)
load_dotenv()

async def fetch_room_metadata(room_name: str, retries: int = 15, delay: float = 1.0):
    async with LiveKitAPI() as lkapi:
        for attempt in range(retries):
            resp = await lkapi.room.list_rooms(ListRoomsRequest())
            for r in resp.rooms:
                if r.name == room_name and r.metadata:
                    logging.info(f"✅ Metadata found, at attempt: {attempt+1}, metadata: {r.metadata}")
                    return r.metadata
            logging.warning(f"⚠️ Attempt {attempt+1}: no metadata, waiting {delay}second...")
            await asyncio.sleep(delay)
    return None

async def entrypoint(ctx: JobContext):
    logging.info(f"🟢 Worker started for room: {ctx.room.name}")
    prompt = "Default prompt"
    meta_str = await fetch_room_metadata(ctx.room.name)
    if meta_str:
        try:
            meta = json.loads(meta_str)
            prompt = meta.get("prompt", prompt)
            logging.info(f"new prompt from REST API: {prompt}")
        except Exception as e:
            logging.warning(f"Retry metadata parse error: {e}")

    logging.info(f"📝 Using prompt: {prompt}")
    logging.info(f"📝room info: {ctx.room}")

    # initialize agent session with OpenAI realtime model
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(model="gpt-4o-realtime-preview-2025-06-03", voice="alloy"),
    )
    # Simli avatar config
    avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=os.getenv("SIMLI_API_KEY"),
            face_id=os.getenv("SIMLI_FACE_ID"),
            max_idle_time=120,
            max_session_length=3600,
        ),
    )
    await avatar.start(session, room=ctx.room)

    # start agent session
    await session.start(
        agent=Agent(instructions=prompt),
        room=ctx.room,
    )

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            job_memory_limit_mb=0,
        )
    )