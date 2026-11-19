"use client";

import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowLeft,
  Camera,
  CheckCheck,
  Mic,
  Paperclip,
  Phone,
  Smile,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  CHAT_CLIENT_NAME,
  chatMessages,
  phaseCards,
} from "./problem-chat-script";

// --- scroll-driven progress ---

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(1);
  const isDesktop = !useIsMobile();

  useEffect(() => {
    if (!isDesktop) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const scrollable = ref.current.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;
        setProgress(Math.max(0, Math.min(1, -rect.top / scrollable)));
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, isDesktop]);

  // mobile: show everything immediately
  return isDesktop ? progress : 1;
}

function subscribeToNothing() {
  return () => {};
}

// False on the server and during hydration, true afterwards: until then every message stays visible.
function useIsHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function useChatTimeline(ref: React.RefObject<HTMLDivElement | null>) {
  const progress = useScrollProgress(ref);
  const mounted = useIsHydrated();

  // messages fill across 0–85 % of scroll, last 15 % is breathing room
  const raw = Math.min(progress / 0.85, 1) * (chatMessages.length + 0.5);
  const visibleCount = mounted
    ? Math.min(chatMessages.length, Math.floor(raw))
    : chatMessages.length;
  const next = chatMessages[visibleCount];
  // Past a third of the way to the next message, its sender starts typing.
  const typing = next && raw - visibleCount > 0.35 ? next.from : null;

  return {
    visible: chatMessages.slice(0, visibleCount),
    devDraft: typing === "dev" ? next?.text : undefined,
    isClientTyping: typing === "client",
    activePhase: chatMessages[visibleCount - 1]?.phaseIndex ?? -1,
    isFinished: visibleCount === chatMessages.length,
  };
}

// --- chat pieces ---

// A phone photo of a screen: cropped, slightly blurred, no URL bar.
function BlurryScreenshot() {
  return (
    <div className="relative mb-1 h-40 w-56 overflow-hidden rounded-md bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-500">
      <div className="absolute inset-0 scale-110 rotate-[-4deg] blur-[2px]">
        <div className="mx-4 mt-5 h-2.5 w-2/3 rounded bg-white/70" />
        <div className="mx-4 mt-2 h-1.5 w-1/2 rounded bg-white/50" />
        <div className="mx-4 mt-4 grid grid-cols-3 gap-1.5">
          <div className="h-14 rounded bg-white/60" />
          <div className="h-14 rounded bg-white/80" />
          <div className="h-14 rounded bg-white/60" />
        </div>
        <div className="mx-auto mt-3 h-4 w-1/3 rounded-full bg-blue-500/70" />
      </div>
      {/* glare from the phone camera */}
      <div className="absolute -top-6 right-2 size-20 rounded-full bg-white/40 blur-xl" />
    </div>
  );
}

type ChatHeaderProps = {
  status: string;
};

function ChatHeader({ status }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 bg-[#008069] px-3 py-2.5 text-white dark:bg-[#202C33]">
      <ArrowLeft className="size-5 shrink-0" />
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DFE5E7] text-sm font-semibold text-[#54656F]">
        S
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-tight font-medium">
          {CHAT_CLIENT_NAME}
        </p>
        <p
          key={status}
          className="animate-in truncate text-xs leading-tight text-white/80 fade-in"
        >
          {status}
        </p>
      </div>
      <Video className="size-5 shrink-0" />
      <Phone className="size-[18px] shrink-0" />
    </div>
  );
}

type ChatBubbleProps = {
  message: (typeof chatMessages)[number];
  isFirstOfGroup: boolean;
  isRead: boolean;
};

function ChatBubble({ message, isFirstOfGroup, isRead }: ChatBubbleProps) {
  const isDev = message.from === "dev";

  return (
    <div
      className={cn(
        "flex animate-in duration-300 fade-in slide-in-from-bottom-2",
        isDev ? "justify-end" : "justify-start",
        isFirstOfGroup && "mt-2",
      )}
    >
      <div
        className={cn(
          "max-w-[82%] rounded-lg px-2 pt-1.5 pb-1 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]",
          isDev
            ? "bg-[#D9FDD3] dark:bg-[#005C4B]"
            : "bg-white dark:bg-[#202C33]",
          isFirstOfGroup && (isDev ? "rounded-tr-none" : "rounded-tl-none"),
        )}
      >
        {message.isImage && <BlurryScreenshot />}
        <div className="flex flex-wrap items-end justify-end gap-x-2">
          {!message.isImage && (
            <p className="flex-1 text-[13.5px] leading-snug whitespace-pre-line text-[#111B21] dark:text-[#E9EDEF]">
              {message.text}
            </p>
          )}
          <span className="flex shrink-0 items-center gap-0.5 text-[10.5px] text-[#667781] dark:text-[#8696A0]">
            {message.time}
            {isDev && (
              <CheckCheck
                className={cn(
                  "size-3.5 transition-colors duration-500",
                  isRead ? "text-[#53BDEB]" : "text-[#8696A0]",
                )}
              />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

type ChatComposerProps = {
  draft: string | undefined;
};

// The developer's reply is typed here before it is sent.
function ChatComposer({ draft }: ChatComposerProps) {
  return (
    <div className="flex items-center gap-2 bg-[#F0F2F5] px-2 py-2 dark:bg-[#202C33]">
      <div className="flex min-h-10 flex-1 items-center gap-2 rounded-full bg-white px-3 dark:bg-[#2A3942]">
        <Smile className="size-5 shrink-0 text-[#54656F] dark:text-[#8696A0]" />
        <span
          className={cn(
            "line-clamp-1 flex-1 text-sm",
            draft
              ? "text-[#111B21] dark:text-[#E9EDEF]"
              : "text-[#667781] dark:text-[#8696A0]",
          )}
        >
          {draft ?? "Message"}
          {draft && (
            <span className="ml-px inline-block h-4 w-px animate-pulse bg-[#00A884] align-middle" />
          )}
        </span>
        <Paperclip className="size-5 shrink-0 text-[#54656F] dark:text-[#8696A0]" />
        {!draft && (
          <Camera className="size-5 shrink-0 text-[#54656F] dark:text-[#8696A0]" />
        )}
      </div>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white">
        <Mic className="size-5" />
      </span>
    </div>
  );
}

// --- component ---

export function ProblemChatAnimation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { visible, devDraft, isClientTyping, activePhase, isFinished } =
    useChatTimeline(sectionRef);

  let status = isFinished ? "last seen today at 00:15" : "online";
  if (isClientTyping) status = "typing…";

  return (
    <div ref={sectionRef} className="relative md:h-[300vh]">
      <div className="py-8 md:sticky md:top-0 md:flex md:h-screen md:items-center md:py-0">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 md:grid-cols-2">
            {/* ── chat window ── */}
            <div className="mx-auto flex w-full max-w-[400px] flex-col overflow-hidden rounded-2xl border shadow-xl">
              <ChatHeader status={status} />
              {/* newest message sits at the bottom, older ones scroll out of the top */}
              <div
                className="flex flex-col justify-end gap-0.5 overflow-hidden bg-[#EFEAE2] px-3 py-3 md:h-[480px] dark:bg-[#0B141A]"
                style={{
                  backgroundImage:
                    "radial-gradient(rgb(0 0 0 / 0.045) 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              >
                <p className="mx-auto mb-2 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#54656F] uppercase shadow-sm dark:bg-[#182229] dark:text-[#8696A0]">
                  Today
                </p>
                {visible.map((message, i) => (
                  <ChatBubble
                    key={i}
                    message={message}
                    isFirstOfGroup={
                      i > 0 && visible[i - 1]?.from !== message.from
                    }
                    // Blue ticks once anything newer arrives, or once the thread ends.
                    isRead={i < visible.length - 1 || isFinished}
                  />
                ))}
              </div>
              <ChatComposer draft={devDraft} />
            </div>

            {/* ── cards — fade in one by one as messages progress ── */}
            <div className="flex flex-col gap-4">
              <p className="text-lg font-medium">Does this sound familiar?</p>
              {phaseCards.map((card, i) => {
                const show = i <= activePhase;
                return (
                  <div
                    key={card.title}
                    className="rounded-xl border bg-background p-7 transition-all duration-500 ease-out"
                    style={{
                      opacity: show ? 1 : 0,
                      transform: show ? "translateY(0)" : "translateY(12px)",
                    }}
                  >
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
