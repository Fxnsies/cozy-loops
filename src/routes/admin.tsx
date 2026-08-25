import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";

import {
  adminEndConversation,
  adminListOrders,
  adminReply,
  adminSetQuote,
} from "@/lib/orders.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Orders dashboard — Cozy Loops" },
      { name: "description", content: "Private dashboard for managing Cozy Loops crochet orders." },
      { property: "og:title", content: "Orders dashboard — Cozy Loops" },
      { property: "og:description", content: "Private dashboard for managing Cozy Loops crochet orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Order = {
  id: string;
  code: string;
  customer_name: string;
  contact: string | null;
  item: string;
  modifications: string | null;
  quote: string | null;
  status: string;
  conversation_closed: boolean;
  created_at: string;
};
type Message = { id: string; order_id: string; sender: string; body: string; created_at: string };

function AdminPage() {
  const list = useServerFn(adminListOrders);
  const reply = useServerFn(adminReply);
  const setQuote = useServerFn(adminSetQuote);
  const endConversation = useServerFn(adminEndConversation);

  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const load = useCallback(
    async (pass: string) => {
      const res = await list({ data: { passcode: pass } });
      setOrders(res.orders as Order[]);
      setMessages(res.messages as Message[]);
    },
    [list],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("cozy-loops-pass");
    if (stored) {
      setPasscode(stored);
      load(stored)
        .then(() => setUnlocked(true))
        .catch(() => sessionStorage.removeItem("cozy-loops-pass"));
    }
  }, [load]);

  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => void load(passcode).catch(() => {}), 15000);
    return () => clearInterval(t);
  }, [unlocked, passcode, load]);

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await load(passcode);
      sessionStorage.setItem("cozy-loops-pass", passcode);
      setUnlocked(true);
    } catch {
      setError("Incorrect passcode.");
    }
  }

  if (!unlocked) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-24">
        <h1 className="text-4xl font-bold text-primary">Cozy Loops</h1>
        <p className="mt-2 text-muted-foreground">Shop owner dashboard</p>
        <form onSubmit={onUnlock} className="card-cozy mt-6 grid gap-4 p-6">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Passcode</span>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
            Unlock
          </button>
        </form>
        <Link to="/" className="mt-6 block text-sm text-muted-foreground underline underline-offset-4">
          ← Back to the shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Orders</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          View shop
        </Link>
      </div>

      {orders.length === 0 && <p className="mt-8 text-muted-foreground">No orders yet.</p>}

      <div className="mt-6 grid gap-6">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            messages={messages.filter((m) => m.order_id === order.id)}
            onQuote={async (quote) => {
              await setQuote({ data: { passcode, order_id: order.id, quote } });
              await load(passcode);
            }}
            onReply={async (body) => {
              await reply({ data: { passcode, order_id: order.id, body } });
              await load(passcode);
            }}
            onEnd={async () => {
              await endConversation({ data: { passcode, order_id: order.id } });
              await load(passcode);
            }}
          />
        ))}
      </div>
    </main>
  );
}

function OrderCard(props: {
  order: Order;
  messages: Message[];
  onQuote: (quote: string) => Promise<void>;
  onReply: (body: string) => Promise<void>;
  onEnd: () => Promise<void>;
}) {
  const { order, messages } = props;
  const [quote, setQuote] = useState(order.quote ?? "");
  const [draft, setDraft] = useState("");

  return (
    <section className="card-cozy p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">
          {order.code} · {order.customer_name}
        </h2>
        <span className="text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleString()}
        </span>
      </div>
      {order.contact && <p className="text-sm text-muted-foreground">Contact: {order.contact}</p>}

      <p className="mt-4 text-sm font-semibold">Wants</p>
      <p className="whitespace-pre-wrap text-muted-foreground">{order.item}</p>
      {order.modifications && (
        <>
          <p className="mt-3 text-sm font-semibold">Modifications</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{order.modifications}</p>
        </>
      )}

      <form
        className="mt-5 flex flex-wrap gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await props.onQuote(quote);
        }}
      >
        <input
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Price, e.g. ₹850"
          className="flex-1 rounded-2xl border border-input bg-background px-4 py-2 outline-none focus:ring-2 focus:ring-ring"
        />
        <button className="rounded-full border border-border px-5 py-2 font-semibold transition hover:bg-muted">
          Save price
        </button>
      </form>

      <ul className="mt-5 grid gap-2">
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.sender === "shop"
                ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
                : "max-w-[85%] rounded-2xl bg-secondary px-4 py-2 text-secondary-foreground"
            }
          >
            <p className="text-xs opacity-70">{m.sender === "shop" ? "You" : order.customer_name}</p>
            <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>

      {order.conversation_closed ? (
        <p className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Conversation ended.
        </p>
      ) : (
        <form
          className="mt-4 grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            await props.onReply(draft.trim());
            setDraft("");
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Write back to this customer…"
            className="rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground">
              Send reply
            </button>
            <button
              type="button"
              onClick={() => void props.onEnd()}
              className="rounded-full border border-destructive px-5 py-2 font-semibold text-destructive transition hover:bg-destructive/10"
            >
              End of conversation
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
