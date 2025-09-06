import logging, os, json
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli
from livekit.plugins import openai, simli
from livekit.api import LiveKitAPI
from livekit.protocol.room import ListRoomsRequest
import asyncio
import aiohttp

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

async def notify_backend_interview_finished(interview_id: str):
    url = os.getenv("BACKEND_API_URL", "http://localhost:4000") + "/candidates/finish"
    async with aiohttp.ClientSession() as s:
        try:
            resp = await s.post(url, json={"interviewId": interview_id}, timeout=10)
            logging.info(f"✅ Interview finished bildirildi, status: {resp.status}")
        except Exception as e:
            logging.error(f"❌ Backend finish çağrısı başarısız: {e}")

async def handle_interview_finish(session: AgentSession, ctx: JobContext):
    room_id = ctx.room.name
    logging.info(f"🛑 Interview bitiş süreci başlatıldı → oda: {room_id}")

    try:
        logging.info("📨 1. Backend'e 'finished' bildirimi gönderiliyor...")
        await notify_backend_interview_finished(room_id)
        logging.info("✅ Backend'e başarılı şekilde bildirildi.")
    except Exception as e:
        logging.error(f"❌ Backend finish bildirimi başarısız: {e}")

    try:
        logging.info("🗑️ 2. Agent session kapatılıyor...")
        await session.aclose()
        logging.info("✅ Agent session kapandı.")
    except Exception as e:
        logging.error(f"❌ Agent session kapatılamadı: {e}")

    try:
        if ctx.room.connection_state == 1:
            logging.info("🔌 3. LiveKit odasından çıkılıyor...")
            await ctx.delete_room()
            logging.info("✅ Oda  silindi.")
        else:
            logging.info("ℹ️ Oda zaten bağlı değil.")
    except Exception as e:
        logging.error(f"❌ Oda bağlantısı kapatılamadı: {e}")

    logging.info("🎉 Interview clean-up süreci tamamlandı.")

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
        turn_detection="realtime_llm",
        min_endpointing_delay=0.8,
        max_endpointing_delay=6.0,
        allow_interruptions=True,
        discard_audio_if_uninterruptible=True,
        min_interruption_duration=0.5,
        agent_false_interruption_timeout = 4.0,
    )

    def on_conversation_item_added(ev):
        try:
            contents = getattr(ev.item, "content", [])
            text = " ".join(contents) if contents else ""
            role = getattr(ev.item, "role", "?")
            print(f"💬 [{role}] {text}")

            normalized = text.strip().lower()
            if role == "assistant" and "mülakat sona erdi" in normalized:
                logging.info("🛑 Agent bitiş cümlesini söyledi, kapatma işlemi başlatılıyor...")
                asyncio.create_task(handle_interview_finish(session, ctx))
        except Exception as e:
            logging.error(f"Listener error: {e}")
    # log conversation items
    session.on("conversation_item_added", on_conversation_item_added)


    # start agent session
    for i in range(10):
        try:
            avatar = simli.AvatarSession(
                simli_config=simli.SimliConfig(
                    api_key=os.getenv("SIMLI_API_KEY"),
                    face_id=os.getenv("SIMLI_FACE_ID"),
                    max_idle_time=30,
                    max_session_length=3600,
                ),
            )
            await avatar.start(session, room=ctx.room)

            await session.start(
                agent=Agent(instructions=prompt),
                room=ctx.room,
            )
            break
        except Exception as e:
            logging.error(f"Session start error, retrying {i+1}/10: {e}")
            await asyncio.sleep(2)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            job_memory_limit_mb=0,
        )
    )