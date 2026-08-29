import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  adminDeleteOrder,
  adminEndConversation,
  adminListOrders,
  adminReopenConversation,
  adminReply,
  adminSetHidden,
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
  stuffing: string | null;
  quote: string | null;
  status: string;
  conversation_closed: boolean;
  hidden: boolean;
  created_at: string;
};
type Message = { id: string; order_id: string; sender: string; body: string; created_at: string };

function AdminPage() {
  const list = useServerFn(adminListOrders);
  const reply = useServerFn(adminReply);
  const setQuote = useServerFn(adminSetQuote);
  const endConversation = useServerFn(adminEndConversation);
  const reopenConversation = useServerFn(adminReopenConversation);
  const setHidden = useServerFn(adminSetHidden);
  const deleteOrder = useServerFn(adminDeleteOrder);

  const [passcode, setPasscode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<"active" | "hidden">("active");

  const load = useCallback(
    async (pass: string) => {
      const res = await list({ data: { passcode: pass } });
      setOrders(res.orders as Order[]);
      setMessages(res.messages as Message[]);
    },
    [list],
  );

  useEffect(() => {
    setPasscode("");
    setShowPass(false);
  }, []);

  useEffect(() => {
    if (unlocked) return;
    setPasscode("");
    setShowPass(false);
  }, [unlocked]);

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
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 pr-14 outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide passcode" : "Show passcode"}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground transition hover:text-foreground"
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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

  const visible = orders.filter((o) => (tab === "hidden" ? o.hidden : !o.hidden));

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Orders</h1>
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
          View shop
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {(["active", "hidden"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                : "rounded-full border border-border px-5 py-2 text-sm font-semibold transition hover:bg-muted"
            }
          >
            {t === "active" ? "Active" : "Hidden"} ({orders.filter((o) => (t === "hidden" ? o.hidden : !o.hidden)).length})
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          {tab === "hidden" ? "Nothing hidden away." : "No orders yet."}
        </p>
      )}

      <div className="mt-6 grid gap-6">
        {visible.map((order) => (
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
            onReopen={async () => {
              await reopenConversation({ data: { passcode, order_id: order.id } });
              await load(passcode);
            }}
            onToggleHidden={async () => {
              await setHidden({ data: { passcode, order_id: order.id, hidden: !order.hidden } });
              await load(passcode);
            }}
            onDelete={async (confirmCode) => {
              await deleteOrder({ data: { passcode, order_id: order.id, confirm_code: confirmCode } });
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
  onReopen: () => Promise<void>;
  onToggleHidden: () => Promise<void>;
  onDelete: (confirmCode: string) => Promise<void>;
}) {
  const { order, messages } = props;
  const [quote, setQuote] = useState(order.quote ?? "");
  const [draft, setDraft] = useState("");
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [confirmCode, setConfirmCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

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
      {order.stuffing && (
        <>
          <p className="mt-3 text-sm font-semibold">Cotton stuffing</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{order.stuffing}</p>
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
        {messages.map((m) =>
          m.sender === "system" ? (
            <li
              key={m.id}
              className="mx-auto max-w-[95%] rounded-2xl border border-dashed border-accent-foreground/40 bg-accent/50 px-4 py-2 text-center text-sm font-semibold text-accent-foreground"
            >
              {m.body}
            </li>
          ) : (
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
          ),
        )}
      </ul>

      {order.conversation_closed ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-muted px-4 py-3">
          <p className="text-sm text-muted-foreground">Conversation ended.</p>
          <button
            type="button"
            onClick={() => void props.onReopen()}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Reopen conversation
          </button>
        </div>
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

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => void props.onToggleHidden()}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
        >
          {order.hidden ? "Unhide" : "Hide"} conversation
        </button>

        {deleteStep === 0 ? (
          <button
            type="button"
            onClick={() => {
              setDeleteStep(1);
              setConfirmCode("");
              setDeleteError("");
            }}
            className="rounded-full border border-destructive px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
          >
            Delete
          </button>
        ) : deleteStep === 1 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3">
            <p className="text-sm font-semibold text-destructive">
              Delete this order and its whole chat?
            </p>
            <button
              type="button"
              onClick={() => setDeleteStep(2)}
              className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"
            >
              Yes, continue
            </button>
            <button
              type="button"
              onClick={() => setDeleteStep(0)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        ) : (
          <form
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setDeleteError("");
              try {
                await props.onDelete(confirmCode.trim());
              } catch {
                setDeleteError("Code did not match. Nothing was deleted.");
              }
            }}
          >
            <label className="text-sm font-semibold text-destructive">
              Type «{order.code}» to confirm
            </label>
            <input
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              className="rounded-2xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">
              Delete permanently
            </button>
            <button
              type="button"
              onClick={() => setDeleteStep(0)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            {deleteError && <p className="w-full text-sm text-destructive">{deleteError}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
