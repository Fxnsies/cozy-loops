import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { CornerPhotos } from "@/components/CornerPhotos";
import { FounderMark } from "@/components/FounderMark";
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
        <p className="font-serif text-sm italic text-muted-foreground">stitched at home, one loop at a time 🧶</p>
        <div className="relative mx-auto mt-3 inline-block">
          <h1
            className="text-6xl font-bold tracking-tight text-primary md:text-7xl"
            style={{ fontFamily: "'DynaPuff', cursive" }}
          >
            <span className="inline-block select-none transition-transform duration-300 hover:-rotate-3">C</span>
            <span className="inline-block -translate-y-1 rotate-2 select-none transition-transform duration-300 hover:rotate-6">o</span>
            <span className="inline-block translate-y-1 -rotate-1 select-none transition-transform duration-300 hover:-rotate-6">z</span>
            <span className="inline-block -translate-y-1 rotate-3 select-none transition-transform duration-300 hover:rotate-12">y</span>
            <span className="inline-block w-2 md:w-4"></span>
            <span className="inline-block -translate-y-1 -rotate-2 select-none transition-transform duration-300 hover:-rotate-12">L</span>
            <span className="inline-block translate-y-1 rotate-1 select-none transition-transform duration-300 hover:rotate-3">o</span>
            <span className="inline-block -rotate-3 select-none transition-transform duration-300 hover:-rotate-6">o</span>
            <span className="inline-block -translate-y-1 rotate-2 select-none transition-transform duration-300 hover:rotate-6">p</span>
            <span className="inline-block translate-y-2 -rotate-1 select-none transition-transform duration-300 hover:-rotate-12">s</span>
          </h1>
          <div className="absolute -bottom-2 left-0 h-2 w-full opacity-40">
            <svg
              width="100%"
              height="8"
              viewBox="0 0 400 8"
              fill="none"
              preserveAspectRatio="none"
              className="text-primary"
            >
              <path
                d="M0 4C20 4 20 1 40 1C60 1 60 7 80 7C100 7 100 1 120 1C140 1 140 7 160 7C180 7 180 1 200 1C220 1 220 7 240 7C260 7 260 1 280 1C300 1 300 7 320 7C340 7 340 1 360 1C380 1 380 4 400 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
            </svg>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          random designs, way too many supplies, and nothing better to do
        </p>
        <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-dashed border-primary/60 bg-card/70 px-4 py-3 font-serif text-base italic text-foreground">
          Paying and picking up happens whenever you see me in person — no online payment, no shipping. 💛
        </p>
      </header>

      {placedCode ? (
        <section className="card-cozy mt-10 p-8 text-center">
          <h2 className="text-3xl font-bold text-primary">Order received!</h2>
          <p className="mt-3 text-muted-foreground">Your order code is</p>
          <p className="mt-2 text-4xl font-bold tracking-[0.3em] text-foreground">{placedCode}</p>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            💬 Your price and updates arrive in the chat on your order page — the wait time is a
            minimum of 5 minutes and at most a day.
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
          <form onSubmit={onSubmit} autoComplete="off" className="mt-5 grid gap-4">
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
              placeholder="Options — frog, bunny, electric turtle (images attached) or anything else you want"
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
              the wait time is a minimum of 5 minutes and at most a day.
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

      {!placedCode && (
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
            autoComplete="off"
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
        {saved.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {saved.map((code) => (
              <li key={code}>
                <Link
                  to="/order/$code"
                  params={{ code }}
                  className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-accent"
                >
                  {code} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      <footer className="mt-10 text-center text-sm text-muted-foreground">
        <Link to="/admin" className="underline underline-offset-4">
          Shop owner login
        </Link>
      </footer>
      <CornerPhotos />
      <FounderMark />
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
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
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
