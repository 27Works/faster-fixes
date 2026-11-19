type Sender = "client" | "dev";

type ChatMessage = {
  from: Sender;
  text: string;
  time: string;
  isImage?: boolean;
  phaseIndex: number;
};

export const CHAT_CLIENT_NAME = "Sarah (Acme Inc.)";

export const phaseCards = [
  {
    title: "The vague instruction",
    description:
      '"Can you make it pop a bit more?" No element, no expected behavior, no definition of done.',
  },
  {
    title: "The blurry screenshot",
    description:
      "Taken on a phone, cropped, no URL bar. You cannot tell which page, which breakpoint, or which state.",
  },
  {
    title: "The dump message",
    description:
      "One message. Twelve separate requests. No priority, no scope. You spend more time untangling it than fixing half of them.",
  },
];

// Every developer question is read, then ignored or answered with something unrelated.
export const chatMessages: ChatMessage[] = [
  {
    from: "client",
    text: "can you check the pricing page?",
    time: "23:47",
    phaseIndex: 0,
  },
  {
    from: "client",
    text: "something's off with the button I think",
    time: "23:47",
    phaseIndex: 0,
  },
  {
    from: "dev",
    text: "Sure. Which button? There are three on that page.",
    time: "23:52",
    phaseIndex: 0,
  },
  {
    from: "client",
    text: "can you just make it look right",
    time: "23:58",
    phaseIndex: 0,
  },
  {
    from: "client",
    text: "screenshot.jpg",
    isImage: true,
    time: "00:03",
    phaseIndex: 1,
  },
  {
    from: "client",
    text: "see? right there (sorry took it from my phone)",
    time: "00:03",
    phaseIndex: 1,
  },
  {
    from: "dev",
    text: "Is that mobile or desktop? I can't see the URL.",
    time: "00:05",
    phaseIndex: 1,
  },
  { from: "client", text: "oh and also:", time: "00:11", phaseIndex: 2 },
  {
    from: "client",
    text: "1. footer link broken\n2. font too small on mobile\n3. logo blurry\n4. need contact form\n5. carousel doesn't work\n6. colors feel off\n7. try different hero layout",
    time: "00:11",
    phaseIndex: 2,
  },
  {
    from: "dev",
    text: "Ok. Which one is most urgent?",
    time: "00:14",
    phaseIndex: 2,
  },
];
