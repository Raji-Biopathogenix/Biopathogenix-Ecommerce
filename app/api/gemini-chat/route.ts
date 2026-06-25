import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type GeminiRequest = {
  messages?: ChatMessage[];
};

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
const CONTACT_DETAILS =
  "For help, contact BioPathogenix:\nPhone: (859) 444-5660\nEmail: order@biopathogenix.com\nAddress: 3004 Park Central Ave, Nicholasville, KY 40356\nMap: https://maps.app.goo.gl/Uz7FhqXWEMZWCSkK6";

const LINK_ENTRIES = [
  { keywords: ["shop", "product", "products", "buy"], label: "Shop", path: "/shop" },
  { keywords: ["contact", "support", "help"], label: "Contact", path: "/contact" },
  { keywords: ["about", "story", "company"], label: "About", path: "/about" },
  { keywords: ["quality", "validation", "kits"], label: "Quality Control", path: "/quality-control" },
  {
    keywords: ["services", "assay", "biobank", "custom kit"],
    label: "Services",
    path: "/services/assay-development",
  },
  { keywords: ["faq", "faqs", "questions"], label: "FAQs", path: "/resources/faqs" },
  { keywords: ["learning", "learning center"], label: "Learning Center", path: "/resources/blog-learning-center" },
  { keywords: ["account", "login", "my account"], label: "My Account", path: "/my-account" },
];

function isLinkIntent(prompt: string) {
  return /(link|url|website|page|redirect|navigate|open|go to)/i.test(prompt);
}

function needsContactDetails(prompt: string) {
  return /(contact|phone|email|address|support|help|order|quote|pricing)/i.test(prompt);
}

function getLinkReply(prompt: string, origin: string) {
  const loweredPrompt = prompt.toLowerCase();
  const matches = LINK_ENTRIES.filter((entry) =>
    entry.keywords.some((keyword) => loweredPrompt.includes(keyword))
  );
  const selectedEntries = matches.length > 0 ? matches : LINK_ENTRIES.slice(0, 5);
  const lines = selectedEntries.map(
    (entry) => `${entry.label}: ${new URL(entry.path, origin).toString()}`
  );

  return `Here are relevant website links:\n${lines.join("\n")}\n\nClick any link to open it.`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeminiRequest;
    const messages = body.messages ?? [];
    const userPrompt = messages
      .filter((message) => message.role === "user")
      .map((message) => message.text)
      .join("\n\n");

    if (!userPrompt.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    if (isLinkIntent(userPrompt)) {
      return NextResponse.json({ reply: getLinkReply(userPrompt, origin) });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: CONTACT_DETAILS });
    }

    const conversation = messages
      .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`)
      .join("\n");
    const allowedLinks = LINK_ENTRIES.map((entry) => `${entry.label}: ${entry.path}`).join(", ");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a professional, concise assistant for the BioPathogenix website.
Guidelines:
- Use a calm, helpful tone. Keep replies under 6 sentences.
- If the request is unclear, ask one clarifying question.
- Never provide medical or diagnostic advice.
- Only share website links from this list: ${allowedLinks}.
- If the user asks about pricing, quotes, orders, or support, include contact details.

Conversation so far:
${conversation}

Answer the latest user message: ${userPrompt}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return NextResponse.json(
        { error: "Gemini API request failed.", details: errorText },
        { status: 502 }
      );
    }

    const data = (await geminiResponse.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      return NextResponse.json({ reply: CONTACT_DETAILS });
    }

    const responseText = needsContactDetails(userPrompt)
      ? `${reply}\n\n${CONTACT_DETAILS}`
      : reply;

    return NextResponse.json({ reply: responseText });
  } catch {
    return NextResponse.json({ reply: CONTACT_DETAILS });
  }
}
