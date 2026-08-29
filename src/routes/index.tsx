import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { createOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cozy Loops — Order Handmade Crochet" },
      {
        name: "description",
        content:
          "Tell Cozy Loops what crochet piece you want, add your modifications, and we'll get back to you with a price.",
      },
      { property: "og:title", content: "Cozy Loops — Order Handmade Crochet" },
      {
        property: "og:description",
        content: "Custom crochet made to order. Describe your piece and we'll quote it within a day.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const placeOrder = useServerFn(createOrder);
  const [saved, setSaved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placedCode, setPlacedCode] = useState("");
  const [track, setTrack] = useState("");
  const [stuffed, setStuffed] = useState<"" | "yes" | "no">("");

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("cozy-loops-orders") ?? "[]"));
    } catch {
      setSaved([]);
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await placeOrder({
        data: {
          customer_name: String(form.get("customer_name") ?? ""),
          contact: String(form.get("contact") ?? ""),
          item: String(form.get("item") ?? ""),
          modifications: String(form.get("modifications") ?? ""),
          stuffing:
            stuffed === "yes"
              ? `Yes — ${String(form.get("stuffing_amount") ?? "").trim() || "amount not specified"}`
              : stuffed === "no"
                ? "No stuffing"
                : "",
        },
      });
      const next = [res.code, ...saved.filter((c) => c !== res.code)].slice(0, 8);
      localStorage.setItem("cozy-loops-orders", JSON.stringify(next));
      setSaved(next);
      setPlacedCode(res.code);
      e.currentTarget.reset();
      setStuffed("");
    } catch {
      setError("Something went wrong. Please check the fields and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">handmade with yarn</p>
        <h1 className="mt-3 text-6xl font-bold text-primary">Cozy Loops</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Crochet pieces made just for you — plushies, bags, sweaters, keychains, anything you can dream up.
        </p>
      </header>

      {placedCode ? (
        <section className="card-cozy mt-10 p-8 text-center">
          <h2 className="text-3xl font-bold text-primary">Order received!</h2>
          <p className="mt-3 text-muted-foreground">Your order code is</p>
          <p className="mt-2 text-4xl font-bold tracking-[0.3em] text-foreground">{placedCode}</p>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            💬 Your price and updates arrive in the chat on your order page — usually within 5
            minutes, at most a day.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/order/$code"
              params={{ code: placedCode }}
              className="rounded-full bg-primary px-7 py-4 text-lg font-bold text-primary-foreground shadow-lg transition hover:opacity-90"
            >
              💬 Open my chat
            </Link>
            <button
              onClick={() => setPlacedCode("")}
              className="rounded-full border border-border px-6 py-3 font-semibold transition hover:bg-muted"
            >
              Place another order
            </button>
          </div>
        </section>
      ) : (
        <section className="card-cozy mt-10 p-7">
          <h2 className="text-2xl font-bold">Place an order</h2>
          <form onSubmit={onSubmit} className="mt-5 grid gap-4">
            <Field label="Your name" name="customer_name" required maxLength={80} />
            <Field
              label="Email or phone (optional)"
              name="contact"
              maxLength={160}
              placeholder="so we can reach you"
            />
            <TextArea
              label="What would you like made?"
              name="item"
              required
              rows={4}
              placeholder="e.g. a chunky crochet bunny plushie, about 30cm tall"
            />
            <TextArea
              label="Any modifications?"
              name="modifications"
              rows={4}
              placeholder="colours, size changes, initials, extra details…"
            />

            <fieldset className="grid gap-3 rounded-2xl border border-input px-4 py-4">
              <legend className="px-1 text-sm font-semibold">
                Do you want it stuffed with cotton?
              </legend>
              <div className="flex flex-wrap gap-3">
                {(["yes", "no"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setStuffed(v)}
                    className={
                      stuffed === v
                        ? "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                        : "rounded-full border border-border px-5 py-2 text-sm font-semibold transition hover:bg-muted"
                    }
                  >
                    {v === "yes" ? "Yes, stuff it" : "No stuffing"}
                  </button>
                ))}
              </div>
              {stuffed === "yes" && (
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">How much stuffing?</span>
                  <input
                    name="stuffing_amount"
                    maxLength={180}
                    placeholder="e.g. lightly stuffed / firm and squishy / very full"
                    className="rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              )}
            </fieldset>

            <p className="rounded-2xl border-2 border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">
              💬 Your price, questions and updates all come through the chat on your order page —
              usually within 5 minutes, at most a day.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send my order"}
            </button>
          </form>
        </section>
      )}

      <section className="card-cozy mt-8 p-7">
        <h2 className="text-xl font-bold">Already ordered?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter your order code to see your price and messages.</p>
        <form
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const code = track.trim().toUpperCase();
            if (code) navigate({ to: "/order/$code", params: { code } });
          }}
        >
          <input
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="ABCD2345"
            maxLength={20}
            className="flex-1 rounded-full border border-input bg-background px-5 py-3 tracking-widest uppercase outline-none focus:ring-2 focus:ring-ring"
          />
          <button className="rounded-full border border-border px-6 py-3 font-semibold transition hover:bg-muted">
            Look up
          </button>
        </form>
      </section>

      <footer className="mt-10 text-center text-sm text-muted-foreground">
        <Link to="/admin" className="underline underline-offset-4">
          Shop owner login
        </Link>
      </footer>
    </main>
  );
}

function Field(props: {
  label: string;
  name: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{props.label}</span>
      <input
        name={props.name}
        required={props.required}
        maxLength={props.maxLength}
        placeholder={props.placeholder}
        className="rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function TextArea(props: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{props.label}</span>
      <textarea
        name={props.name}
        required={props.required}
        rows={props.rows}
        maxLength={1000}
        placeholder={props.placeholder}
        className="rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
