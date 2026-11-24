import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COUPLE_FORTUNES,
  KRATHONG_ADDONS,
  KRATHONG_ITEMS,
  LOY_KRATHONG_LOCATIONS,
  type FloatedKrathong,
  type LocationId,
  type OrderReceipt,
  type RoomState,
} from './data/loyKrathongData';
import {
  STORAGE_KEY,
  calculateOrderSummary,
  createFloatedKrathong,
  createOrderReceipt,
  drawCoupleFortune,
  generateNewRoomId,
  parsePersistedState,
  sanitizeRoomId,
} from './utils/loyKrathongLogic';
import { AmbientSoundEngine } from './utils/soundscape';
import { downloadMemoryCardPng } from './utils/memoryCardRenderer';
import { Header } from './components/Header';
import {
  RiverStageCanvas,
  type FireworkTrigger,
  type PetalsTrigger,
} from './components/RiverStageCanvas';
import { LocationSelector } from './components/LocationSelector';
import { KrathongShop } from './components/KrathongShop';
import { CoupleFloatRitual } from './components/CoupleFloatRitual';
import { CoupleFortune } from './components/CoupleFortune';
import { MemoryLog } from './components/MemoryLog';

function getInitialRoomId(): string {
  if (typeof window === 'undefined') {
    return sanitizeRoomId(null);
  }
  const params = new URLSearchParams(window.location.search);
  return sanitizeRoomId(params.get('room'));
}

export default function App() {
  const initialLocal = useMemo(() => {
    if (typeof window === 'undefined') {
      return parsePersistedState(null);
    }
    return parsePersistedState(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const [roomId, setRoomId] = useState<string>(() => getInitialRoomId());
  const roomIdRef = useRef<string>(roomId);
  roomIdRef.current = roomId;

  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const [selectedLocationId, setSelectedLocationId] = useState<LocationId>(
    initialLocal.selectedLocationId
  );
  const [selectedKrathongId, setSelectedKrathongId] = useState<string>(
    initialLocal.selectedKrathongId
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([
    'addon-twin-candle',
  ]);
  const [purchasedOrder, setPurchasedOrder] = useState<OrderReceipt | null>(
    initialLocal.purchasedOrder
  );
  const [floatedKrathongs, setFloatedKrathongs] = useState<FloatedKrathong[]>(
    initialLocal.floatedKrathongs
  );
  const [activeKrathongId, setActiveKrathongId] = useState<string | null>(
    initialLocal.floatedKrathongs[0]?.id ?? null
  );
  const [latestFortuneId, setLatestFortuneId] = useState<number | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const soundEnabledRef = useRef<boolean>(false);
  soundEnabledRef.current = soundEnabled;
  const soundEngineRef = useRef<AmbientSoundEngine | null>(null);

  const [fireworkSignal, setFireworkSignal] = useState<FireworkTrigger | null>(
    null
  );
  const [petalsSignal, setPetalsSignal] = useState<PetalsTrigger | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const applyRoomState = useCallback((state: RoomState) => {
    setSelectedLocationId(state.selectedLocationId);
    setFloatedKrathongs(state.floatedKrathongs);
    setLatestFortuneId(state.latestFortuneId);
    setAnniversaryDate(state.anniversaryDate);
    setActiveKrathongId((curr) => {
      if (curr && state.floatedKrathongs.some((k) => k.id === curr)) {
        return curr;
      }
      return state.floatedKrathongs[0]?.id ?? null;
    });
  }, []);

  // Hydrate initial room state over HTTP so UI renders room data right away
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rooms/${encodeURIComponent(roomId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { state?: RoomState; onlineCount?: number } | null) => {
        if (cancelled || !data?.state) return;
        applyRoomState(data.state);
        if (typeof data.onlineCount === 'number') {
          setOnlineCount(data.onlineCount);
        }
      })
      .catch(() => {
        // Fallback smoothly to local state when offline
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, applyRoomState]);

  // Persistent WebSocket connection with automatic reconnect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let disposed = false;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?room=${encodeURIComponent(
        roomIdRef.current
      )}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        if (disposed) {
          ws.close();
          return;
        }
        setWsConnected(true);
      });

      ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as Record<string, unknown>;
          switch (msg.type) {
            case 'room:state': {
              const state = msg.state as RoomState | undefined;
              if (state) {
                applyRoomState(state);
              }
              if (typeof msg.onlineCount === 'number') {
                setOnlineCount(msg.onlineCount);
              }
              break;
            }
            case 'presence:update': {
              if (typeof msg.onlineCount === 'number') {
                setOnlineCount(msg.onlineCount);
              }
              break;
            }
            case 'location:changed': {
              if (typeof msg.locationId === 'string') {
                setSelectedLocationId(msg.locationId as LocationId);
              }
              break;
            }
            case 'krathong:floated': {
              const incoming = msg.krathong as FloatedKrathong | undefined;
              if (!incoming?.id) break;
              setFloatedKrathongs((prev) => {
                if (prev.some((k) => k.id === incoming.id)) {
                  return prev;
                }
                return [incoming, ...prev];
              });
              setActiveKrathongId(incoming.id);
              break;
            }
            case 'krathong:deleted': {
              const deletedId = typeof msg.id === 'string' ? msg.id : null;
              if (!deletedId) break;
              setFloatedKrathongs((prev) => {
                const next = prev.filter((k) => k.id !== deletedId);
                setActiveKrathongId((curr) =>
                  curr === deletedId ? next[0]?.id ?? null : curr
                );
                return next;
              });
              break;
            }
            case 'effect:firework': {
              setFireworkSignal({
                xRatio: typeof msg.xRatio === 'number' ? msg.xRatio : 0.5,
                yRatio: typeof msg.yRatio === 'number' ? msg.yRatio : 0.2,
                burstId:
                  typeof msg.burstId === 'string'
                    ? msg.burstId
                    : `${Date.now()}`,
              });
              if (soundEnabledRef.current) {
                soundEngineRef.current?.playSoftNote(587.33, 0.08, 1.2);
              }
              break;
            }
            case 'effect:petals': {
              setPetalsSignal({
                burstId:
                  typeof msg.burstId === 'string'
                    ? msg.burstId
                    : `${Date.now()}`,
              });
              break;
            }
            case 'fortune:drawn': {
              if (typeof msg.fortuneId === 'number') {
                setLatestFortuneId(msg.fortuneId);
              }
              break;
            }
            case 'anniversary:updated': {
              setAnniversaryDate(
                typeof msg.date === 'string' ? msg.date : null
              );
              break;
            }
          }
        } catch {
          // Ignore invalid JSON frames
        }
      });

      ws.addEventListener('close', () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        setWsConnected(false);
        if (!disposed) {
          reconnectTimer = window.setTimeout(connect, 1500);
        }
      });

      ws.addEventListener('error', () => {
        ws.close();
      });
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [applyRoomState]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      soundEngineRef.current?.stop();
    };
  }, []);

  // Persist personal selections locally (excluding large optional photos already saved on server)
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedLocationId,
          selectedKrathongId,
          purchasedOrder,
          floatedKrathongs: floatedKrathongs.slice(0, 20),
        })
      );
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [
    selectedLocationId,
    selectedKrathongId,
    purchasedOrder,
    floatedKrathongs,
  ]);

  const sendWsMessage = useCallback((payload: Record<string, unknown>): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const currentLocation = useMemo(
    () =>
      LOY_KRATHONG_LOCATIONS.find((loc) => loc.id === selectedLocationId) ??
      LOY_KRATHONG_LOCATIONS[0],
    [selectedLocationId]
  );

  const currentKrathong = useMemo(
    () =>
      KRATHONG_ITEMS.find((item) => item.id === selectedKrathongId) ??
      KRATHONG_ITEMS[0],
    [selectedKrathongId]
  );

  const currentFortune = useMemo(
    () =>
      latestFortuneId !== null
        ? COUPLE_FORTUNES.find((f) => f.id === latestFortuneId) ?? null
        : null,
    [latestFortuneId]
  );

  const currentSummary = useMemo(
    () =>
      calculateOrderSummary(
        currentKrathong,
        quantity,
        selectedAddonIds,
        KRATHONG_ADDONS
      ),
    [currentKrathong, quantity, selectedAddonIds]
  );

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    el.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const handleSelectLocation = (id: LocationId) => {
    setSelectedLocationId(id);
    sendWsMessage({ type: 'location:change', locationId: id });
  };

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleConfirmPurchase = () => {
    const receipt = createOrderReceipt(
      currentKrathong,
      quantity,
      selectedAddonIds
    );
    setPurchasedOrder(receipt);
  };

  const handleFloatKrathong = (payload: {
    yourName: string;
    partnerName: string;
    wish: string;
    photoDataUrl?: string;
  }) => {
    const newKrathong = createFloatedKrathong({
      input: payload,
      krathong: currentKrathong,
      location: currentLocation,
      addonIds: selectedAddonIds,
      existingCount: floatedKrathongs.length,
    });

    setFloatedKrathongs((prev) => [newKrathong, ...prev]);
    setActiveKrathongId(newKrathong.id);
    sendWsMessage({ type: 'krathong:float', krathong: newKrathong });

    if (soundEnabledRef.current) {
      soundEngineRef.current?.playSoftNote(440, 0.08, 1.8);
    }
    scrollToSection('river-stage');
  };

  const handleDeleteMemory = (id: string) => {
    setFloatedKrathongs((prev) => {
      const next = prev.filter((k) => k.id !== id);
      if (activeKrathongId === id) {
        setActiveKrathongId(next[0]?.id ?? null);
      }
      return next;
    });
    sendWsMessage({ type: 'krathong:delete', id });
  };

  const handleFocusOnRiver = (id: string) => {
    const found = floatedKrathongs.find((k) => k.id === id);
    if (found) {
      setSelectedLocationId(found.locationId);
      setActiveKrathongId(found.id);
      sendWsMessage({ type: 'location:change', locationId: found.locationId });
    }
    scrollToSection('river-stage');
  };

  const handleCopyRoomLink = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    try {
      void navigator.clipboard?.writeText(shareUrl).catch(() => {
        // Clipboard API may be unavailable in restricted contexts
      });
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleCreateNewRoom = () => {
    const nextRoom = generateNewRoomId();
    roomIdRef.current = nextRoom;
    setRoomId(nextRoom);
    setFloatedKrathongs([]);
    setActiveKrathongId(null);
    setLatestFortuneId(null);
    setAnniversaryDate(null);

    if (typeof window !== 'undefined') {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('room', nextRoom);
      window.history.replaceState(null, '', nextUrl.toString());
    }

    sendWsMessage({ type: 'room:join', roomId: nextRoom });
  };

  const handleToggleSound = () => {
    if (!soundEngineRef.current) {
      soundEngineRef.current = new AmbientSoundEngine();
    }
    if (soundEnabled) {
      soundEngineRef.current.stop();
      setSoundEnabled(false);
    } else {
      const started = soundEngineRef.current.start();
      setSoundEnabled(started);
    }
  };

  const handleTriggerFirework = (xRatio: number, yRatio: number) => {
    const sent = sendWsMessage({
      type: 'effect:firework',
      xRatio,
      yRatio,
    });
    if (!sent) {
      setFireworkSignal({
        xRatio,
        yRatio,
        burstId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      });
      if (soundEnabledRef.current) {
        soundEngineRef.current?.playSoftNote(587.33, 0.08, 1.2);
      }
    }
  };

  const handleTriggerPetals = () => {
    const sent = sendWsMessage({ type: 'effect:petals' });
    if (!sent) {
      setPetalsSignal({
        burstId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      });
    }
  };

  const handleDrawFortune = () => {
    const drawn = drawCoupleFortune(latestFortuneId);
    setLatestFortuneId(drawn.id);
    sendWsMessage({ type: 'fortune:draw', fortuneId: drawn.id });
    if (soundEnabledRef.current) {
      soundEngineRef.current?.playSoftNote(493.88, 0.07, 1.4);
    }
  };

  const handleChangeAnniversaryDate = (nextDate: string | null) => {
    setAnniversaryDate(nextDate);
    sendWsMessage({ type: 'anniversary:set', date: nextDate });
  };

  const handleDownloadCard = (item: FloatedKrathong) => {
    void downloadMemoryCardPng(item);
  };

  return (
    <div className="min-h-screen bg-[#08111E] text-[#F5EFE6]">
      <Header
        hasPurchasedOrder={Boolean(purchasedOrder)}
        floatedCount={floatedKrathongs.length}
        onNavigate={scrollToSection}
      />

      <main>
        <RiverStageCanvas
          location={currentLocation}
          krathongs={floatedKrathongs}
          activeKrathongId={activeKrathongId}
          roomId={roomId}
          onlineCount={onlineCount}
          wsConnected={wsConnected}
          soundEnabled={soundEnabled}
          fireworkSignal={fireworkSignal}
          petalsSignal={petalsSignal}
          onSelectKrathong={setActiveKrathongId}
          onStartJourney={() => scrollToSection('locations')}
          onGoToFloat={() => scrollToSection('float')}
          onCopyRoomLink={handleCopyRoomLink}
          onCreateNewRoom={handleCreateNewRoom}
          onToggleSound={handleToggleSound}
          onTriggerFirework={handleTriggerFirework}
          onTriggerPetals={handleTriggerPetals}
          onDownloadCard={handleDownloadCard}
        />

        <LocationSelector
          locations={LOY_KRATHONG_LOCATIONS}
          selectedLocationId={selectedLocationId}
          onSelectLocation={handleSelectLocation}
        />

        <KrathongShop
          items={KRATHONG_ITEMS}
          addons={KRATHONG_ADDONS}
          selectedKrathongId={selectedKrathongId}
          quantity={quantity}
          selectedAddonIds={selectedAddonIds}
          purchasedOrder={purchasedOrder}
          onSelectKrathong={setSelectedKrathongId}
          onChangeQuantity={setQuantity}
          onToggleAddon={handleToggleAddon}
          onConfirmPurchase={handleConfirmPurchase}
          onProceedToFloat={() => scrollToSection('float')}
        />

        <CoupleFloatRitual
          location={currentLocation}
          krathong={currentKrathong}
          purchasedOrder={purchasedOrder}
          totalEstimate={currentSummary.totalAmount}
          onQuickBuyAndEquip={handleConfirmPurchase}
          onGoToShop={() => scrollToSection('shop')}
          onFloatKrathong={handleFloatKrathong}
        />

        <CoupleFortune
          currentFortune={currentFortune}
          onDrawFortune={handleDrawFortune}
        />

        <MemoryLog
          krathongs={floatedKrathongs}
          activeKrathongId={activeKrathongId}
          anniversaryDate={anniversaryDate}
          onChangeAnniversaryDate={handleChangeAnniversaryDate}
          onFocusOnRiver={handleFocusOnRiver}
          onDownloadCard={handleDownloadCard}
          onDeleteMemory={handleDeleteMemory}
        />
      </main>

      <footer className="border-t border-[#F5EFE6]/10 bg-[#060D17]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-[#A8B7CC] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-display text-sm text-[#F5EFE6]">
            ลอยกระทงของจุ้ยกับแพน — คืนวันเพ็ญลอยกระทงคู่กัน
          </p>
          <p>
            สร้างขึ้นเพื่อคืนวันเพ็ญอันแสนอบอุ่น · ห้องร่วมกัน เซียมซีคู่ และสมุดภาพความทรงจำ
          </p>
        </div>
      </footer>
    </div>
  );
}
