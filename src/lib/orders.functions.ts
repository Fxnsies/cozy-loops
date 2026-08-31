import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderInput = z.object({
  customer_name: z.string().trim().min(1).max(80),
  contact: z.string().trim().max(160).optional().default(""),
  item: z.string().trim().min(1).max(1000),
  modifications: z.string().trim().max(1000).optional().default(""),
  stuffing: z.string().trim().max(200).optional().default(""),
});

const codeInput = z.object({ code: z.string().trim().min(4).max(20) });

const messageInput = z.object({
  code: z.string().trim().min(4).max(20),
  body: z.string().trim().min(1).max(1000),
});

const adminInput = z.object({ passcode: z.string().min(1).max(200) });

const adminReplyInput = z.object({
  passcode: z.string().min(1).max(200),
  order_id: z.string().uuid(),
  body: z.string().trim().min(1).max(1000),
});

const adminQuoteInput = z.object({
  passcode: z.string().min(1).max(200),
  order_id: z.string().uuid(),
  quote: z.string().trim().max(200),
});

const adminCloseInput = z.object({
  passcode: z.string().min(1).max(200),
  order_id: z.string().uuid(),
});

const adminHideInput = z.object({
  passcode: z.string().min(1).max(200),
  order_id: z.string().uuid(),
  hidden: z.boolean(),
});

const adminDeleteInput = z.object({
  passcode: z.string().min(1).max(200),
  order_id: z.string().uuid(),
  confirm_code: z.string().trim().min(1).max(20),
});

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function checkPasscode(passcode: string) {
  const expected = process.env["SHOP_ADMIN_PASSCODE"];
  if (!expected || passcode !== expected) {
    throw new Response("Unauthorized", { status: 401 });
  }
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = makeCode();
    const { error } = await supabaseAdmin.from("orders").insert({
      code,
      customer_name: data.customer_name,
      contact: data.contact || null,
      item: data.item,
      modifications: data.modifications || null,
      stuffing: data.stuffing || null,
    });
    if (error) throw new Error("Could not place the order. Please try again.");
    return { code };
  });

export const getOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => codeInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, code, customer_name, item, modifications, stuffing, quote, status, conversation_closed, created_at")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (!order) return null;
    const { data: messages } = await supabaseAdmin
      .from("order_messages")
      .select("id, sender, body, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
    const { id: _id, ...publicOrder } = order;
    return { order: publicOrder, messages: messages ?? [] };
  });

export const sendCustomerMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => messageInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, conversation_closed")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.conversation_closed) throw new Error("This conversation has been closed.");
    const { error } = await supabaseAdmin
      .from("order_messages")
      .insert({ order_id: order.id, sender: "customer", body: data.body });
    if (error) throw new Error("Could not send the message.");
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminInput.parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: messages } = await supabaseAdmin
      .from("order_messages")
      .select("id, order_id, sender, body, created_at")
      .order("created_at", { ascending: true });
    return { orders: orders ?? [], messages: messages ?? [] };
  });

export const adminReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminReplyInput.parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("order_messages")
      .insert({ order_id: data.order_id, sender: "shop", body: data.body });
    if (error) throw new Error("Could not send the reply.");
    return { ok: true };
  });

export const adminSetQuote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminQuoteInput.parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("quote")
      .eq("id", data.order_id)
      .maybeSingle();
    const previous = existing?.quote ?? null;
    const next = data.quote || null;
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ quote: next, status: next ? "quoted" : "new" })
      .eq("id", data.order_id);
    if (error) throw new Error("Could not save the price.");

    if (previous !== next) {
      const notice =
        next === null
          ? "The price for this order has been removed — we'll share an updated one soon."
          : previous
            ? `Price updated: ${previous} → ${next}`
            : `Price set: ${next}`;
      await supabaseAdmin
        .from("order_messages")
        .insert({ order_id: data.order_id, sender: "system", body: notice });
    }
    return { ok: true, changed: previous !== next };
  });

export const adminEndConversation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminCloseInput.parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ conversation_closed: true, status: "closed" })
      .eq("id", data.order_id);
    if (error) throw new Error("Could not close the conversation.");
    return { ok: true };
  });

export const adminReopenConversation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminCloseInput.parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("quote")
      .eq("id", data.order_id)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ conversation_closed: false, status: existing?.quote ? "quoted" : "new" })
      .eq("id", data.order_id);
    if (error) throw new Error("Could not reopen the conversation.");
    await supabaseAdmin
      .from("order_messages")
      .insert({ order_id: data.order_id, sender: "system", body: "This conversation has been reopened." });
    return { ok: true };
  });

export const adminSetHidden = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminHideInput.parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ hidden: data.hidden })
      .eq("id", data.order_id);
    if (error) throw new Error("Could not update this conversation.");
    return { ok: true };
  });

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminDeleteInput.parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, code")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.code.toUpperCase() !== data.confirm_code.toUpperCase()) {
      throw new Error("The typed order code does not match.");
    }
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.order_id);
    if (error) throw new Error("Could not delete this order.");
    return { ok: true };
  });

const customerDeleteInput = z.object({
  code: z.string().trim().min(4).max(20),
  confirm_code: z.string().trim().min(1).max(20),
});

export const customerDeleteOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => customerDeleteInput.parse(data))
  .handler(async ({ data }) => {
    const code = data.code.toUpperCase();
    if (code !== data.confirm_code.trim().toUpperCase()) {
      throw new Error("The typed order code does not match.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", order.id);
    if (error) throw new Error("Could not delete this order.");
    return { ok: true };
  });
