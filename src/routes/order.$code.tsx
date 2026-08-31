import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";

import { FounderMark } from "@/components/FounderMark";
import { customerDeleteOrder, getOrder, sendCustomerMessage } from "@/lib/orders.functions";

export const Route = createFileRoute("/order/$code")({
  head: () => ({
    meta: [
      { title: "Your order — Cozy Loops" },
      { name: "description", content: "Check your Cozy Loops order price and chat with the shop." },
      { property: "og:title", content: "Your order — Cozy Loops" },
      { property: "og:description", content: "Check your Cozy Loops order price and chat with the shop." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

type Message = { id: string; sender: string; body: string; created_at: string };
type OrderView = {
  code: string;
  customer_name: string;
  item: string;
  modifications: string | null;
  stuffing: string | null;
  quote: string | null;
  status: string;
  conversation_closed: boolean;
  created_at: string;
};

function OrderPage() {
  const { code } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);
  const sendMessage = useServerFn(sendCustomerMessage);
  const deleteOrder = useServerFn(customerDeleteOrder);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    const res = await fetchOrder({ data: { code } });
    if (res) {
      setOrder(res.order as OrderView);
      setMessages(res.messages as Message[]);
    } else {
      setOrder(null);
    }
    setLoading(false);
  }, [code, fetchOrder]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setError("");
    try {
      await sendMessage({ data: { code, body } });
      setDraft("");
      await load();
    } catch {
      setError("Message could not be sent.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12">
      <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Cozy Loops
      </Link>

      {loading ? (
        <p className="mt-10 text-muted-foreground">Loading your order…</p>
      ) : !order ? (
        <div className="card-cozy mt-8 p-8 text-center">
          <h1 className="text-2xl font-bold">We couldn't find that order</h1>
          <p className="mt-2 text-muted-foreground">Double-check the code «{code}» and try again.</p>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h1 className="text-3xl font-bold text-primary">Order {order.code}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed by {order.customer_name} on {new Date(order.created_at).toLocaleDateString()}
            </p>
            <div className="mt-4 rounded-2xl bg-accent/60 px-5 py-4">
              {order.quote ? (
                <p className="text-lg font-bold text-accent-foreground">Your price: {order.quote}</p>
              ) : (
                <p className="text-sm text-accent-foreground">
                  We're working out your price — the wait time is a minimum of 5 minutes and at most
                  a day.
                </p>
              )}
            </div>
          </section>

          <section className="card-cozy mt-6 border-2 border-primary p-7">
            <h2 className="text-2xl font-bold text-primary">💬 Chat with Cozy Loops</h2>
            <p className="mt-1 text-sm font-semibold">
              This chat is how we send your price, questions and updates.
            </p>
            {messages.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                No messages yet — we'll write to you here soon.
              </p>
            )}
            <ul className="mt-4 grid gap-3">
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
                        ? "max-w-[85%] rounded-2xl bg-secondary px-4 py-3 text-secondary-foreground"
                        : "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
                    }
                  >
                    <p className="text-xs opacity-70">{m.sender === "shop" ? "Cozy Loops" : "You"}</p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                  </li>
                ),
              )}
            </ul>

            {order.conversation_closed ? (
              <p className="mt-5 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                This conversation has been closed by Cozy Loops.
              </p>
            ) : (
              <form onSubmit={onSend} className="mt-5 grid gap-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Write back to Cozy Loops…"
                  className="rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button className="justify-self-start rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90">
                  Send message
                </button>
              </form>
            )}
          </section>

          <section className="card-cozy mt-6 p-7">
            <h2 className="text-xl font-bold">Your order details</h2>
            <dl className="mt-4 grid gap-4">
              <div>
                <dt className="text-sm font-semibold">What you asked for</dt>
                <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">{order.item}</dd>
              </div>
              {order.modifications && (
                <div>
                  <dt className="text-sm font-semibold">Modifications</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">{order.modifications}</dd>
                </div>
              )}
              {order.stuffing && (
                <div>
                  <dt className="text-sm font-semibold">Cotton stuffing</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">{order.stuffing}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="card-cozy mt-6 p-7">
            <h2 className="text-xl font-bold">Delete this order</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This removes the order and the whole chat for good. It can't be undone.
            </p>
            {deleteStep === 0 ? (
              <button
                onClick={() => {
                  setDeleteStep(1);
                  setDeleteError("");
                }}
                className="mt-4 rounded-full border border-destructive px-6 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
              >
                Delete my order
              </button>
            ) : (
              <div className="mt-4 grid gap-3">
                <p className="text-sm font-semibold text-destructive">
                  Are you sure you want to delete this order and its whole chat?
                </p>
                {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={async () => {
                      setDeleteError("");
                      try {
                        await deleteOrder({ data: { code: order.code, confirm_code: order.code } });
                        try {
                          const list: string[] = JSON.parse(
                            localStorage.getItem("cozy-loops-orders") ?? "[]",
                          );
                          localStorage.setItem(
                            "cozy-loops-orders",
                            JSON.stringify(list.filter((c) => c !== order.code)),
                          );
                        } catch {
                          /* ignore */
                        }
                        void navigate({ to: "/" });
                      } catch {
                        setDeleteError("Could not delete this order.");
                      }
                    }}
                    className="rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-destructive-foreground transition hover:opacity-90"
                  >
                    Yes, delete it
                  </button>
                  <button
                    onClick={() => {
                      setDeleteStep(0);
                      setDeleteError("");
                    }}
                    className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
      <FounderMark />
    </main>
  );
}
