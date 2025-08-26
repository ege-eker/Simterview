import {AccessToken, RoomServiceClient} from "livekit-server-sdk";
import dotenv from "dotenv";
dotenv.config();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "";

// Debugging output to verify environment variables
console.log("LiveKit URL:", LIVEKIT_URL ? LIVEKIT_URL : "Not Provided");
console.log("LiveKit API Key:", LIVEKIT_API_KEY ? "Provided" : "Not Provided");
console.log("LiveKit API Secret:", LIVEKIT_API_SECRET ? "Provided" : "Not Provided");

export function createParticipantToken(roomName: string, identity: string) {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity,
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
    });

    return at.toJwt();
}

export { LIVEKIT_URL };
export const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);