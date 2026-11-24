import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  COUPLE_FORTUNES,
  KRATHONG_ITEMS,
  LOY_KRATHONG_LOCATIONS,
  type FloatedKrathong,
  type LocationId,
  type RoomState,
} from './src/data/loyKrathongData';
import {
  DEFAULT_ROOM_ID,
  sanitizeRoomId,
  validatePhotoDataUrl,
} from './src/utils/loyKrathongLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const ROOMS_FILE = path.resolve(DATA_DIR, 'rooms.json');

const VALID_LOCATION_IDS = new Set<string>(
  LOY_KRATHONG_LOCATIONS.map((l) => l.id)
);
const VALID_KRATHONG_IDS = new Set<string>(KRATHONG_ITEMS.map((k) => k.id));
const VALID_FORTUNE_IDS = new Set<number>(COUPLE_FORTUNES.map((f) => f.id));

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadAllRooms(): Record<string, RoomState> {
  ensureDataDir();
  if (!fs.existsSync(ROOMS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(ROOMS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, RoomState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const roomsStore: Record<string, RoomState> = loadAllRooms();

let saveTimer: NodeJS.Timeout | null = null;
function schedulePersist(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      ensureDataDir();
      fs.writeFileSync(ROOMS_FILE, JSON.stringify(roomsStore, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist rooms store:', err);
    }
  }, 150);
}

function getOrCreateRoom(rawRoomId: string | undefined | null): RoomState {
  const roomId = sanitizeRoomId(rawRoomId);
  const existing = roomsStore[roomId];
  if (existing) {
    return existing;
  }
  const fresh: RoomState = {
    roomId,
    selectedLocationId: LOY_KRATHONG_LOCATIONS[0].id,
    floatedKrathongs: [],
    latestFortuneId: null,
    anniversaryDate: null,
    updatedAt: new Date().toISOString(),
  };
  roomsStore[roomId] = fresh;
  schedulePersist();
  return fresh;
}

function sanitizeFloatedKrathongPayload(
  raw: unknown,
  existingCount: number
): FloatedKrathong | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const yourName =
    typeof obj.yourName === 'string' ? obj.yourName.trim().slice(0, 40) : '';
  const partnerName =
    typeof obj.partnerName === 'string'
      ? obj.partnerName.trim().slice(0, 40)
      : '';
  const wish =
    typeof obj.wish === 'string' ? obj.wish.trim().slice(0, 300) : '';

  if (!yourName || !partnerName || wish.length < 4) {
    return null;
  }

  const krathongId =
    typeof obj.krathongId === 'string' && VALID_KRATHONG_IDS.has(obj.krathongId)
      ? obj.krathongId
      : KRATHONG_ITEMS[0].id;
  const krathongMeta =
    KRATHONG_ITEMS.find((k) => k.id === krathongId) ?? KRATHONG_ITEMS[0];

  const locationId =
    typeof obj.locationId === 'string' && VALID_LOCATION_IDS.has(obj.locationId)
      ? (obj.locationId as LocationId)
      : LOY_KRATHONG_LOCATIONS[0].id;
  const locationMeta =
    LOY_KRATHONG_LOCATIONS.find((l) => l.id === locationId) ??
    LOY_KRATHONG_LOCATIONS[0];

  const id =
    typeof obj.id === 'string' && /^[a-zA-Z0-9_-]{4,64}$/.test(obj.id)
      ? obj.id
      : `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const addonNames = Array.isArray(obj.addonNames)
    ? obj.addonNames
        .filter((n): n is string => typeof n === 'string')
        .map((n) => n.trim().slice(0, 60))
        .slice(0, 6)
    : [];

  const safePhoto =
    typeof obj.photoDataUrl === 'string'
      ? validatePhotoDataUrl(obj.photoDataUrl)
      : undefined;

  const laneRatio =
    typeof obj.laneRatio === 'number' &&
    obj.laneRatio >= 0.3 &&
    obj.laneRatio <= 0.85
      ? obj.laneRatio
      : Number((0.36 + (existingCount % 5) * 0.095).toFixed(3));

  const initialXRatio =
    typeof obj.initialXRatio === 'number' &&
    obj.initialXRatio >= 0 &&
    obj.initialXRatio <= 1
      ? obj.initialXRatio
      : 0.22 + ((existingCount * 0.19) % 0.55);

  const speed =
    typeof obj.speed === 'number' && obj.speed >= 5 && obj.speed <= 25
      ? obj.speed
      : 12 + (existingCount % 3) * 2.5;

  return {
    id,
    yourName,
    partnerName,
    wish,
    krathongId: krathongMeta.id,
    krathongName: krathongMeta.name,
    visualStyle: krathongMeta.visualStyle,
    candleCount: krathongMeta.candleCount,
    locationId: locationMeta.id,
    locationName: locationMeta.name,
    addonNames,
    ...(safePhoto ? { photoDataUrl: safePhoto } : {}),
    floatedAt:
      typeof obj.floatedAt === 'string' && !Number.isNaN(Date.parse(obj.floatedAt))
        ? obj.floatedAt
        : new Date().toISOString(),
    isUserCreated: true,
    laneRatio,
    initialXRatio,
    speed,
  };
}

interface ClientSession {
  ws: WebSocket;
  roomId: string;
}

const roomClients = new Map<string, Set<ClientSession>>();

function getOnlineCount(roomId: string): number {
  return roomClients.get(roomId)?.size ?? 0;
}

function broadcastToRoom(roomId: string, payload: unknown): void {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  const serialized = JSON.stringify(payload);
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(serialized);
    }
  }
}

function joinRoom(session: ClientSession, nextRoomId: string): void {
  const prevSet = roomClients.get(session.roomId);
  if (prevSet) {
    prevSet.delete(session);
    if (prevSet.size === 0) {
      roomClients.delete(session.roomId);
    } else {
      broadcastToRoom(session.roomId, {
        type: 'presence:update',
        onlineCount: prevSet.size,
      });
    }
  }

  session.roomId = nextRoomId;
  let nextSet = roomClients.get(nextRoomId);
  if (!nextSet) {
    nextSet = new Set<ClientSession>();
    roomClients.set(nextRoomId, nextSet);
  }
  nextSet.add(session);

  const state = getOrCreateRoom(nextRoomId);
  const onlineCount = nextSet.size;

  if (session.ws.readyState === WebSocket.OPEN) {
    session.ws.send(
      JSON.stringify({
        type: 'room:state',
        state,
        onlineCount,
      })
    );
  }

  broadcastToRoom(nextRoomId, {
    type: 'presence:update',
    onlineCount,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/rooms/:roomId', (req, res) => {
    const roomId = sanitizeRoomId(req.params.roomId);
    const state = getOrCreateRoom(roomId);
    res.json({
      state,
      onlineCount: Math.max(1, getOnlineCount(roomId)),
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const reqUrl = new URL(req.url || '/ws', 'http://localhost');
    const initialRoom = sanitizeRoomId(
      reqUrl.searchParams.get('room') ?? DEFAULT_ROOM_ID
    );
    const session: ClientSession = { ws, roomId: initialRoom };
    joinRoom(session, initialRoom);

    ws.on('message', (rawData) => {
      try {
        const text = rawData.toString();
        if (text.length > 420_000) return;
        const msg = JSON.parse(text) as Record<string, unknown>;
        if (!msg || typeof msg.type !== 'string') return;

        const room = getOrCreateRoom(session.roomId);

        switch (msg.type) {
          case 'room:join': {
            const targetRoom = sanitizeRoomId(
              typeof msg.roomId === 'string' ? msg.roomId : DEFAULT_ROOM_ID
            );
            joinRoom(session, targetRoom);
            break;
          }
          case 'location:change': {
            if (
              typeof msg.locationId === 'string' &&
              VALID_LOCATION_IDS.has(msg.locationId)
            ) {
              room.selectedLocationId = msg.locationId as LocationId;
              room.updatedAt = new Date().toISOString();
              schedulePersist();
              broadcastToRoom(session.roomId, {
                type: 'location:changed',
                locationId: room.selectedLocationId,
              });
            }
            break;
          }
          case 'krathong:float': {
            const cleaned = sanitizeFloatedKrathongPayload(
              msg.krathong,
              room.floatedKrathongs.length
            );
            if (!cleaned) return;
            // Idempotent insert check
            if (room.floatedKrathongs.some((k) => k.id === cleaned.id)) {
              return;
            }
            room.floatedKrathongs = [cleaned, ...room.floatedKrathongs].slice(
              0,
              60
            );
            room.updatedAt = new Date().toISOString();
            schedulePersist();
            broadcastToRoom(session.roomId, {
              type: 'krathong:floated',
              krathong: cleaned,
            });
            break;
          }
          case 'krathong:delete': {
            if (typeof msg.id !== 'string') return;
            const prevLen = room.floatedKrathongs.length;
            room.floatedKrathongs = room.floatedKrathongs.filter(
              (k) => k.id !== msg.id
            );
            if (room.floatedKrathongs.length !== prevLen) {
              room.updatedAt = new Date().toISOString();
              schedulePersist();
              broadcastToRoom(session.roomId, {
                type: 'krathong:deleted',
                id: msg.id,
              });
            }
            break;
          }
          case 'effect:firework': {
            const xRatio =
              typeof msg.xRatio === 'number'
                ? Math.max(0.08, Math.min(0.92, msg.xRatio))
                : 0.5;
            const yRatio =
              typeof msg.yRatio === 'number'
                ? Math.max(0.08, Math.min(0.36, msg.yRatio))
                : 0.2;
            broadcastToRoom(session.roomId, {
              type: 'effect:firework',
              xRatio,
              yRatio,
              burstId: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            });
            break;
          }
          case 'effect:petals': {
            broadcastToRoom(session.roomId, {
              type: 'effect:petals',
              burstId: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            });
            break;
          }
          case 'fortune:draw': {
            if (
              typeof msg.fortuneId === 'number' &&
              VALID_FORTUNE_IDS.has(msg.fortuneId)
            ) {
              room.latestFortuneId = msg.fortuneId;
              room.updatedAt = new Date().toISOString();
              schedulePersist();
              broadcastToRoom(session.roomId, {
                type: 'fortune:drawn',
                fortuneId: msg.fortuneId,
              });
            }
            break;
          }
          case 'anniversary:set': {
            const nextDate =
              typeof msg.date === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(msg.date)
                ? msg.date
                : null;
            room.anniversaryDate = nextDate;
            room.updatedAt = new Date().toISOString();
            schedulePersist();
            broadcastToRoom(session.roomId, {
              type: 'anniversary:updated',
              date: nextDate,
            });
            break;
          }
        }
      } catch {
        // Ignore malformed client payloads
      }
    });

    ws.on('close', () => {
      const set = roomClients.get(session.roomId);
      if (set) {
        set.delete(session);
        if (set.size === 0) {
          roomClients.delete(session.roomId);
        } else {
          broadcastToRoom(session.roomId, {
            type: 'presence:update',
            onlineCount: set.size,
          });
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
