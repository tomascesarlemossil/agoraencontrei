export type VoiceChunkSource = "assistant_stream" | "assistant_final" | "system";

export interface VoiceControllerOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  autoSpeak?: boolean;
  minChunkLength?: number;
  onStartSpeaking?: (text: string) => void;
  onEndSpeaking?: (text: string) => void;
  onQueueChange?: (size: number) => void;
  onVoiceSelected?: (voiceName: string | null) => void;
  onError?: (error: Error) => void;
}

export interface EnqueueSpeechInput {
  text: string;
  source?: VoiceChunkSource;
  priority?: boolean;
}

interface SpeechQueueItem {
  id: string;
  text: string;
  source: VoiceChunkSource;
}

/**
 * TomasVoiceController
 *
 * Controla leitura em voz alta do texto do chat no frontend usando Web Speech API.
 *
 * Regras implementadas:
 * - fala por frases ou blocos curtos, nunca token por token;
 * - permite enfileirar texto conforme o streaming chega;
 * - cancela imediatamente quando o usuário interrompe;
 * - suporta pausa, retomada e limpeza de fila;
 * - tenta selecionar voz pt-BR quando disponível.
 *
 * Uso recomendado:
 * 1. Instancie uma vez no provider/layout do chat.
 * 2. Chame pushStreamingText(delta) durante o stream.
 * 3. Chame flushPendingText() quando a resposta terminar.
 * 4. Chame interruptForUserInput() quando o usuário mandar nova mensagem.
 */
export class TomasVoiceController {
  private synth: SpeechSynthesis | null;
  private options: Required<Omit<VoiceControllerOptions,
    "onStartSpeaking" | "onEndSpeaking" | "onQueueChange" | "onVoiceSelected" | "onError">> &
    Pick<VoiceControllerOptions, "onStartSpeaking" | "onEndSpeaking" | "onQueueChange" | "onVoiceSelected" | "onError">;

  private queue: SpeechQueueItem[] = [];
  private pendingStreamingBuffer = "";
  private isDestroyed = false;
  private voicesLoaded = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentItem: SpeechQueueItem | null = null;

  constructor(options: VoiceControllerOptions = {}) {
    this.synth = typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis
      : null;

    this.options = {
      lang: options.lang ?? "pt-BR",
      rate: options.rate ?? 1,
      pitch: options.pitch ?? 1,
      volume: options.volume ?? 1,
      voiceName: options.voiceName ?? "",
      autoSpeak: options.autoSpeak ?? true,
      minChunkLength: options.minChunkLength ?? 24,
      onStartSpeaking: options.onStartSpeaking,
      onEndSpeaking: options.onEndSpeaking,
      onQueueChange: options.onQueueChange,
      onVoiceSelected: options.onVoiceSelected,
      onError: options.onError,
    };

    if (this.synth) {
      this.loadVoices();
      if (typeof window !== "undefined") {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * Recebe deltas de streaming e transforma em blocos faláveis.
   */
  pushStreamingText(delta: string): void {
    if (!delta || this.isDestroyed) return;

    this.pendingStreamingBuffer += delta;

    const chunks = this.extractSpeakableChunks(this.pendingStreamingBuffer);
    if (!chunks.ready.length) return;

    for (const chunk of chunks.ready) {
      this.enqueue({ text: chunk, source: "assistant_stream" });
    }

    this.pendingStreamingBuffer = chunks.remaining;
  }

  /**
   * Força o envio do buffer restante ao final da resposta.
   */
  flushPendingText(): void {
    if (this.isDestroyed) return;

    const text = this.pendingStreamingBuffer.trim();
    this.pendingStreamingBuffer = "";

    if (text.length >= this.options.minChunkLength || /[.!?…:]$/.test(text)) {
      this.enqueue({ text, source: "assistant_final" });
    }
  }

  enqueue(input: EnqueueSpeechInput): void {
    if (!this.synth || this.isDestroyed) return;

    const normalized = this.normalizeText(input.text);
    if (!normalized) return;

    const item: SpeechQueueItem = {
      id: this.makeId(),
      text: normalized,
      source: input.source ?? "assistant_final",
    };

    if (input.priority) {
      this.queue.unshift(item);
    } else {
      this.queue.push(item);
    }

    this.emitQueueChange();

    if (this.options.autoSpeak) {
      this.playNext();
    }
  }

  playNext(): void {
    if (!this.synth || this.isDestroyed) return;
    if (this.currentUtterance || this.synth.speaking || this.synth.pending) return;

    const nextItem = this.queue.shift();
    this.emitQueueChange();
    if (!nextItem) return;

    this.currentItem = nextItem;

    const utterance = new SpeechSynthesisUtterance(nextItem.text);
    utterance.lang = this.options.lang;
    utterance.rate = this.options.rate;
    utterance.pitch = this.options.pitch;
    utterance.volume = this.options.volume;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.options.onStartSpeaking?.(nextItem.text);
    };

    utterance.onend = () => {
      this.options.onEndSpeaking?.(nextItem.text);
      this.currentUtterance = null;
      this.currentItem = null;
      this.playNext();
    };

    utterance.onerror = (event) => {
      this.currentUtterance = null;
      this.currentItem = null;
      const error = new Error(`Falha ao reproduzir voz: ${event.error}`);
      this.options.onError?.(error);
      this.playNext();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause(): void {
    if (!this.synth || this.isDestroyed) return;
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (!this.synth || this.isDestroyed) return;
    if (this.synth.paused) {
      this.synth.resume();
      return;
    }
    this.playNext();
  }

  /**
   * Cancela fala atual e fila. Use quando o usuário interromper com nova pergunta.
   */
  interruptForUserInput(): void {
    this.pendingStreamingBuffer = "";
    this.clearQueue();
    this.cancelCurrentSpeech();
  }

  cancel(): void {
    this.interruptForUserInput();
  }

  cancelCurrentSpeech(): void {
    if (!this.synth || this.isDestroyed) return;
    this.currentUtterance = null;
    this.currentItem = null;
    this.synth.cancel();
  }

  clearQueue(): void {
    this.queue = [];
    this.emitQueueChange();
  }

  destroy(): void {
    this.interruptForUserInput();
    this.isDestroyed = true;
    if (typeof window !== "undefined" && this.synth) {
      this.synth.onvoiceschanged = null;
    }
  }

  getState() {
    return {
      supported: Boolean(this.synth),
      speaking: Boolean(this.synth?.speaking),
      paused: Boolean(this.synth?.paused),
      queueSize: this.queue.length,
      currentText: this.currentItem?.text ?? null,
      selectedVoice: this.selectedVoice?.name ?? null,
      pendingBufferLength: this.pendingStreamingBuffer.length,
    };
  }

  private loadVoices(): void {
    if (!this.synth) return;

    const voices = this.synth.getVoices();
    if (!voices.length) return;

    this.voicesLoaded = true;

    let chosen: SpeechSynthesisVoice | null = null;

    if (this.options.voiceName) {
      chosen = voices.find((voice) => voice.name === this.options.voiceName) ?? null;
    }

    if (!chosen) {
      const preferredPtBr = voices.find((voice) => voice.lang.toLowerCase() === "pt-br");
      const preferredPt = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"));
      const fallback = voices[0] ?? null;
      chosen = preferredPtBr ?? preferredPt ?? fallback;
    }

    const changed = chosen !== this.selectedVoice;
    this.selectedVoice = chosen;
    if (changed) {
      this.options.onVoiceSelected?.(chosen?.name ?? null);
    }
  }

  private extractSpeakableChunks(text: string): { ready: string[]; remaining: string } {
    const normalized = text.replace(/\s+/g, " ");
    const parts = normalized.split(/(?<=[.!?…:])\s+/);

    if (parts.length <= 1) {
      return { ready: [], remaining: normalized };
    }

    const ready = parts
      .slice(0, -1)
      .map((part) => part.trim())
      .filter((part) => part.length >= this.options.minChunkLength);

    const remaining = parts[parts.length - 1] ?? "";
    return { ready, remaining };
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\s+/g, " ")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .trim();
  }

  private emitQueueChange(): void {
    this.options.onQueueChange?.(this.queue.length);
  }

  private makeId(): string {
    return `speech_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
