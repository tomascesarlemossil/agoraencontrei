"use client";

import React, { FormEvent, useMemo, useRef, useState } from "react";
import { TomasVoiceProvider } from "./TomasVoiceProvider";
import { useTomasVoice } from "./useTomasVoice";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  meta?: {
    confidence?: "alta" | "média" | "baixa";
    sourceLabel?: string;
  };
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function HeaderBar() {
  const {
    mode,
    setMode,
    enabled,
    setEnabled,
    speaking,
    paused,
    pause,
    resume,
    cancel,
    queueSize,
  } = useTomasVoice();

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_12px_60px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">
            AgoraEncontrei · inteligência local
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Tomás · Consultor Imobiliário de Franca e Região
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300 lg:text-base">
            Chat premium com voz integrada, leitura por frases, resposta em streaming e
            lógica de avaliação baseada em comparáveis reais da carteira.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              enabled
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-white/8 text-zinc-200 hover:bg-white/12"
            }`}
          >
            Voz {enabled ? "ligada" : "desligada"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "browser" ? "premium-realtime" : "browser")}
            className="rounded-2xl bg-white/8 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/12"
          >
            Modo: {mode === "browser" ? "navegador" : "premium"}
          </button>

          <button
            type="button"
            onClick={() => (speaking && !paused ? pause() : resume())}
            className="rounded-2xl bg-white/8 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/12"
          >
            {speaking && !paused ? "Pausar voz" : "Retomar voz"}
          </button>

          <button
            type="button"
            onClick={cancel}
            className="rounded-2xl bg-white/8 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/12"
          >
            Parar fala
          </button>

          <div className="rounded-2xl bg-white/6 px-4 py-3 text-sm text-zinc-300">
            Status: {speaking ? (paused ? "pausado" : "falando") : "ocioso"}
          </div>

          <div className="rounded-2xl bg-white/6 px-4 py-3 text-sm text-zinc-300">
            Fila: {queueSize}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestedPrompts({ onSelect }: { onSelect: (value: string) => void }) {
  const prompts = [
    "Qual a faixa correta para anunciar um apartamento no Centro de Franca?",
    "Esse terreno no Gaia está bem posicionado frente aos comparáveis?",
    "Qual o perfil de mercado do Reserva Abaeté hoje?",
    "Me explique quem é o Tomás e como ele avalia imóveis.",
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-400/40 hover:bg-white/10"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-[28px] px-5 py-4 shadow-lg lg:max-w-[75%] ${
          isUser
            ? "bg-emerald-500 text-white shadow-emerald-500/20"
            : "border border-white/10 bg-white/7 text-zinc-100 backdrop-blur-md"
        }`}
      >
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
          <span>{isUser ? "Você" : "Tomás"}</span>
          {message.meta?.confidence && !isUser ? (
            <span className="rounded-full bg-white/10 px-2 py-1 tracking-normal normal-case text-[11px]">
              confiança {message.meta.confidence}
            </span>
          ) : null}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-7 lg:text-[15px]">
          {message.content}
        </div>
        {!isUser && message.meta?.sourceLabel ? (
          <div className="mt-3 text-xs text-zinc-400">Base: {message.meta.sourceLabel}</div>
        ) : null}
      </div>
    </div>
  );
}

function ChatSurface() {
  const { pushStreamingText, flushPendingText, interruptForUserInput } = useTomasVoice();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: "assistant",
      content:
        "Muito prazer. Eu sou o Tomás, a inteligência imobiliária da AgoraEncontrei. Minha base foi construída a partir da experiência real de Tomas Lemos, unindo tecnologia com o legado da Imobiliária Lemos, fundada por Noemia Lemos em 2002 em Franca/SP.",
      meta: { confidence: "alta", sourceLabel: "identidade institucional" },
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  async function sendMessage(prompt?: string) {
    const content = (prompt ?? input).trim();
    if (!content || isLoading) return;

    interruptForUserInput();
    setIsLoading(true);
    setInput("");

    const userMessage: ChatMessage = { id: generateId(), role: "user", content };
    const assistantId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      meta: { confidence: "média", sourceLabel: "stream em andamento" },
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    requestAnimationFrame(() => {
      viewportRef.current?.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Falha ao iniciar stream do chat.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        pushStreamingText(chunk);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: accumulated,
                  meta: { confidence: "média", sourceLabel: "comparáveis + mercado local" },
                }
              : message,
          ),
        );

        requestAnimationFrame(() => {
          viewportRef.current?.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: "smooth",
          });
        });
      }

      flushPendingText();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado no chat.";
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content:
                  "Tive um problema ao gerar a resposta em streaming. Verifique a rota /api/chat/stream e tente novamente.\n\nDetalhe: " +
                  message,
                meta: { confidence: "baixa", sourceLabel: "erro de integração" },
              }
            : item,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_380px]">
      <div className="rounded-[32px] border border-white/10 bg-[#0b1220]/90 shadow-[0_18px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="border-b border-white/8 px-6 py-5">
          <SuggestedPrompts onSelect={(value) => void sendMessage(value)} />
        </div>

        <div
          ref={viewportRef}
          className="h-[58vh] space-y-4 overflow-y-auto px-5 py-5 lg:px-6"
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading ? (
            <div className="flex justify-start">
              <div className="rounded-[24px] border border-white/10 bg-white/7 px-5 py-4 text-sm text-zinc-300">
                Tomás está analisando comparáveis e montando a resposta...
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="border-t border-white/8 p-4 lg:p-5">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur-md">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pergunte sobre preço, comparáveis, bairro, liquidez, anúncio ou identidade do Tomás..."
              className="min-h-[120px] w-full resize-none bg-transparent px-3 py-2 text-base text-white outline-none placeholder:text-zinc-500"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                O Tomás responde com base em inventário ativo, submercado e comportamento do CRECISP.
              </div>
              <button
                type="submit"
                disabled={!canSend}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Respondendo..." : "Enviar"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <aside className="space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_18px_80px_rgba(0,0,0,0.2)]">
          <div className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">
            Modo premium
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">O que o Tomás considera</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-300">
            <p>• comparáveis ativos da carteira</p>
            <p>• comportamento regional do CRECISP</p>
            <p>• tipologia e submercado do imóvel</p>
            <p>• diferença entre anúncio e fechamento provável</p>
            <p>• faixa compatível, não chute exato</p>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 p-6 backdrop-blur-xl shadow-[0_18px_80px_rgba(0,0,0,0.2)]">
          <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/80">
            Identidade
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">Tom de voz institucional</h2>
          <p className="mt-4 text-sm leading-7 text-zinc-200">
            O Tomás fala como a inteligência imobiliária da AgoraEncontrei, construída a
            partir da experiência real de Tomas Lemos e do legado da Imobiliária Lemos,
            fundada por Noemia Lemos em 2002 em Franca/SP.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default function ChatPage() {
  return (
    <TomasVoiceProvider initialMode="browser">
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(180deg,#061018_0%,#0b1220_45%,#0f172a_100%)] px-4 py-6 text-white lg:px-8 lg:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <HeaderBar />
          <ChatSurface />
        </div>
      </main>
    </TomasVoiceProvider>
  );
}
