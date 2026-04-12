"use client";

import { useContext } from "react";
import { TomasVoiceContext } from "./TomasVoiceProvider";

export function useTomasVoice() {
  const context = useContext(TomasVoiceContext);
  if (!context) {
    throw new Error("useTomasVoice must be used inside <TomasVoiceProvider />");
  }
  return context;
}

export type UseTomasVoiceReturn = ReturnType<typeof useTomasVoice>;
