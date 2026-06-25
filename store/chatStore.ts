import { useCallback, useState } from "react";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

type ChatSizePreset = "sm" | "md" | "lg" | "xl";

type ChatState = {
  isOpen: boolean;

  // popup position
  x: number; // px from left
  y: number; // px from top

  // popup size
  width: number;
  height: number;
  preset: ChatSizePreset;

  messages: ChatMessage[];
  input: string;
  isSending: boolean;

  open: () => void;
  close: () => void;
  toggle: () => void;

  setInput: (v: string) => void;
  addMessage: (m: ChatMessage) => void;
  setSending: (v: boolean) => void;

  setPreset: (p: ChatSizePreset) => void;
  setSize: (w: number, h: number) => void;
  setPosition: (x: number, y: number) => void;
};

const presetMap: Record<ChatSizePreset, { w: number; h: number }> = {
  sm: { w: 320, h: 420 },
  md: { w: 380, h: 520 },
  lg: { w: 460, h: 620 },
  xl: { w: 560, h: 740 },
};

export function useChatStore(): ChatState {
  const [isOpen, setIsOpen] = useState(false);

  // 0,0 means not initialized yet; we set bottom-right on mount
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const [width, setWidth] = useState(presetMap.md.w);
  const [height, setHeight] = useState(presetMap.md.h);
  const [preset, setPresetState] = useState<ChatSizePreset>("md");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInputState] = useState("");
  const [isSending, setIsSending] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const setInput = useCallback((v: string) => setInputState(v), []);
  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => [...prev, m]);
  }, []);
  const setSending = useCallback((v: boolean) => setIsSending(v), []);

  const setPreset = useCallback((p: ChatSizePreset) => {
    const { w, h } = presetMap[p];
    setPresetState(p);
    setWidth(w);
    setHeight(h);
  }, []);

  const setSize = useCallback((w: number, h: number) => {
    setWidth(w);
    setHeight(h);
  }, []);

  const setPosition = useCallback((nextX: number, nextY: number) => {
    setX(nextX);
    setY(nextY);
  }, []);

  return {
    isOpen,
    x,
    y,
    width,
    height,
    preset,
    messages,
    input,
    isSending,
    open,
    close,
    toggle,
    setInput,
    addMessage,
    setSending,
    setPreset,
    setSize,
    setPosition,
  };
}
