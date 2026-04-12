"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { TomasVoiceController } from "./tomas_voice_controller";

export type TomasVoiceMode = "browser" | "premium-realtime";

export interface TomasVoiceState {
  enabled: boolean;
  speaking: boolean;
  paused: boolean;
  queueSize: number;
  selectedVoice: string | null;
  mode: TomasVoiceMode;
  premiumConnected: boolean;
}

export interface PremiumRealtimeConfig {
  /**
   * Endpoint do seu backend que cria uma sessão efêmera para WebRTC.
   * Ex.: /api/realtime/session
   */
  sessionEndpoint: string;
  /** Nome do modelo realtime configurado no backend. */
  model?: string;
  /** Voz preferencial. */
  voice?: string;
  /** Instruções opcionais para o agente de voz premium. */
  instructions?: string;
}

export interface TomasVoiceContextValue extends TomasVoiceState {
  setEnabled: (value: boolean) => void;
  toggleEnabled: () => void;
  setMode: (mode: TomasVoiceMode) => void;
  pushStreamingText: (delta: string) => void;
  flushPendingText: () => void;
  speakNow: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  interruptForUserInput: () => void;
  connectPremiumVoice: () => Promise<void>;
  disconnectPremiumVoice: () => void;
  sendPremiumTextTurn: (text: string) => Promise<void>;
}

export const TomasVoiceContext = createContext<TomasVoiceContextValue | null>(null);

export interface TomasVoiceProviderProps extends PropsWithChildren {
  initialEnabled?: boolean;
  initialMode?: TomasVoiceMode;
  browserLang?: string;
  browserVoiceName?: string;
  autoSpeak?: boolean;
  premiumRealtime?: PremiumRealtimeConfig;
}

function createBrowserController(params: {
  lang: string;
  voiceName?: string;
  autoSpeak: boolean;
  setSpeaking: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  setQueueSize: (value: number) => void;
  setSelectedVoice: (value: string | null) => void;
}) {
  return new TomasVoiceController({
    lang: params.lang,
    voiceName: params.voiceName,
    autoSpeak: params.autoSpeak,
    onStartSpeaking: () => {
      params.setSpeaking(true);
      params.setPaused(false);
    },
    onEndSpeaking: () => {
      params.setSpeaking(false);
    },
    onQueueChange: params.setQueueSize,
    onVoiceSelected: params.setSelectedVoice,
  });
}

export function TomasVoiceProvider({
  children,
  initialEnabled = true,
  initialMode = "browser",
  browserLang = "pt-BR",
  browserVoiceName,
  autoSpeak = true,
  premiumRealtime,
}: TomasVoiceProviderProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [mode, setMode] = useState<TomasVoiceMode>(initialMode);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [premiumConnected, setPremiumConnected] = useState(false);

  const browserControllerRef = useRef<TomasVoiceController | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    browserControllerRef.current = createBrowserController({
      lang: browserLang,
      voiceName: browserVoiceName,
      autoSpeak,
      setSpeaking,
      setPaused,
      setQueueSize,
      setSelectedVoice,
    });

    return () => {
      browserControllerRef.current?.cancel();
      browserControllerRef.current = null;
    };
  }, [browserLang, browserVoiceName, autoSpeak]);

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const pushStreamingText = useCallback((delta: string) => {
    if (!enabled || mode !== "browser") return;
    browserControllerRef.current?.pushStreamingText(delta);
  }, [enabled, mode]);

  const flushPendingText = useCallback(() => {
    if (!enabled || mode !== "browser") return;
    browserControllerRef.current?.flushPendingText();
  }, [enabled, mode]);

  const speakNow = useCallback((text: string) => {
    if (!enabled || mode !== "browser") return;
    browserControllerRef.current?.enqueue({ text });
  }, [enabled, mode]);

  const pause = useCallback(() => {
    if (mode === "browser") {
      browserControllerRef.current?.pause();
      setPaused(true);
      return;
    }
    audioElRef.current?.pause();
    setPaused(true);
  }, [mode]);

  const resume = useCallback(() => {
    if (!enabled) return;
    if (mode === "browser") {
      browserControllerRef.current?.resume();
      setPaused(false);
      return;
    }
    void audioElRef.current?.play();
    setPaused(false);
  }, [enabled, mode]);

  const cancel = useCallback(() => {
    if (mode === "browser") {
      browserControllerRef.current?.cancel();
    } else {
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.srcObject = null;
      }
    }
    setSpeaking(false);
    setPaused(false);
    setQueueSize(0);
  }, [mode]);

  const interruptForUserInput = useCallback(() => {
    cancel();
  }, [cancel]);

  const disconnectPremiumVoice = useCallback(() => {
    try {
      dataChannelRef.current?.close();
      peerConnectionRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    } finally {
      dataChannelRef.current = null;
      peerConnectionRef.current = null;
      mediaStreamRef.current = null;
      setPremiumConnected(false);
      setSpeaking(false);
      setPaused(false);
    }
  }, []);

  const connectPremiumVoice = useCallback(async () => {
    if (!premiumRealtime) {
      throw new Error("premiumRealtime não configurado no TomasVoiceProvider");
    }
    if (typeof window === "undefined") {
      throw new Error("Realtime premium só pode ser iniciado no navegador");
    }

    disconnectPremiumVoice();

    const sessionRes = await fetch(premiumRealtime.sessionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: premiumRealtime.model,
        voice: premiumRealtime.voice,
        instructions: premiumRealtime.instructions,
      }),
    });

    if (!sessionRes.ok) {
      const text = await sessionRes.text();
      throw new Error(`Falha ao criar sessão realtime: ${text}`);
    }

    const session = await sessionRes.json();
    const ephemeralKey: string | undefined = session?.client_secret?.value;
    const model = session?.model || premiumRealtime.model || "gpt-realtime-1.5";

    if (!ephemeralKey) {
      throw new Error("Sessão realtime sem client_secret.value");
    }

    const pc = new RTCPeerConnection();
    const audioEl = new Audio();
    audioEl.autoplay = true;
    audioElRef.current = audioEl;

    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0];
      setSpeaking(true);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setPremiumConnected(state === "connected");
      if (state === "disconnected" || state === "failed" || state === "closed") {
        setSpeaking(false);
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    const dc = pc.createDataChannel("oai-events");
    dc.onopen = () => {
      setQueueSize(0);
      setPremiumConnected(true);
      if (premiumRealtime.instructions || premiumRealtime.voice) {
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: premiumRealtime.instructions,
            voice: premiumRealtime.voice,
          },
        }));
      }
    };
    dc.onmessage = (event) => {
      const payload = safeJsonParse(event.data);
      if (!payload) return;
      if (payload.type === "response.audio.delta" || payload.type === "response.output_audio.delta") {
        setSpeaking(true);
      }
      if (payload.type === "response.done") {
        setSpeaking(false);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });

    if (!sdpRes.ok) {
      const text = await sdpRes.text();
      throw new Error(`Falha na negociação SDP com OpenAI: ${text}`);
    }

    const answerSdp = await sdpRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    peerConnectionRef.current = pc;
    dataChannelRef.current = dc;
  }, [disconnectPremiumVoice, premiumRealtime]);

  const sendPremiumTextTurn = useCallback(async (text: string) => {
    if (mode !== "premium-realtime") {
      throw new Error("sendPremiumTextTurn requer mode='premium-realtime'");
    }
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      throw new Error("Canal realtime não conectado");
    }

    dataChannelRef.current.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text,
          },
        ],
      },
    }));

    dataChannelRef.current.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
      },
    }));
  }, [mode]);

  useEffect(() => {
    return () => {
      disconnectPremiumVoice();
    };
  }, [disconnectPremiumVoice]);

  const value = useMemo<TomasVoiceContextValue>(() => ({
    enabled,
    speaking,
    paused,
    queueSize,
    selectedVoice,
    mode,
    premiumConnected,
    setEnabled,
    toggleEnabled,
    setMode,
    pushStreamingText,
    flushPendingText,
    speakNow,
    pause,
    resume,
    cancel,
    interruptForUserInput,
    connectPremiumVoice,
    disconnectPremiumVoice,
    sendPremiumTextTurn,
  }), [
    enabled,
    speaking,
    paused,
    queueSize,
    selectedVoice,
    mode,
    premiumConnected,
    toggleEnabled,
    pushStreamingText,
    flushPendingText,
    speakNow,
    pause,
    resume,
    cancel,
    interruptForUserInput,
    connectPremiumVoice,
    disconnectPremiumVoice,
    sendPremiumTextTurn,
  ]);

  return (
    <TomasVoiceContext.Provider value={value}>
      {children}
    </TomasVoiceContext.Provider>
  );
}

function safeJsonParse(value: unknown): Record<string, any> | null {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
