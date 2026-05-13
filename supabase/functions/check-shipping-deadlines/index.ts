// Scans orders and enforces:
// 1. 48h shipping SLA (seller hasn't shipped):
//    - 24h: notify seller (once)
//    - 48h: mark overdue + notify admins (once)
// 2. Delivery confirmation flow (item shipped, expected_delivery reached):
//    - On expected_delivery date: notify buyer to confirm receipt (once)
//    - 12h after expected_delivery: auto-complete the item if no buyer response
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOUR = 60 * 60 * 1000;
const DELIVERY_CONFIRM_WINDOW_MS = 12 * HOUR;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Pull recent non-cancelled orders (last 30 days covers shipping SLA + delivery flow)
  const since = new Date(Date.now() - 30 * 24 * HOUR).toISOString();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, buyer_id, created_at, status, items, item_status")
    .gte("created_at", since)
    .neq("status", "cancelled");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Admin recipients (one notification per admin per overdue item)
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  const adminIds = (admins ?? []).map((a: any) => a.user_id);

  let reminders24 = 0;
  let escalations48 = 0;
  let deliveryPrompts = 0;
  let autoCompletions = 0;
  const now = Date.now();

  for (const o of orders ?? []) {
    const createdAt = new Date(o.created_at).getTime();
    const ageH = (now - createdAt) / HOUR;

    const itemStatus: Record<string, any> = { ...(o.item_status ?? {}) };
    let mutated = false;

    for (const item of (o.items ?? []) as any[]) {
      const lid = item?.listing_id;
      if (!lid) continue;
      const entry = { ...(itemStatus[lid] ?? {}) };
      const s = (entry.status ?? "").toLowerCase();
      const isFinal = s === "completed" || s === "received" || s === "not_received";
      const isShipped = s === "shipped" || s === "delivered";

      // Resolve seller for notifications
      let sellerId: string | undefined = item.seller_id;
      const needsSeller = !isFinal && !isShipped && ageH >= 24;
      if (needsSeller && !sellerId) {
        const { data: l } = await supabase
          .from("listings")
          .select("seller_id")
          .eq("id", lid)
          .maybeSingle();
        sellerId = l?.seller_id;
      }

      // ---- Shipping SLA flow (item NOT shipped yet) ----
      if (!isFinal && !isShipped) {
        // 24h reminder
        if (ageH >= 24 && ageH < 48 && !entry.reminder_24h_sent_at) {
          if (sellerId) {
            await supabase.rpc("create_notification", {
              _user_id: sellerId,
              _type: "shipping_reminder",
              _title: "Reminder: ship your order",
              _body: `Please ship "${item.title ?? "your item"}" — 24 hours have passed.`,
              _link: "/my-listings",
              _audience: "user",
            });
          }
          entry.reminder_24h_sent_at = new Date().toISOString();
          itemStatus[lid] = entry;
          mutated = true;
          reminders24++;
        }

        // 48h escalation
        if (ageH >= 48 && !entry.overdue_at) {
          entry.overdue_at = new Date().toISOString();
          itemStatus[lid] = entry;
          mutated = true;
          escalations48++;

          if (sellerId) {
            await supabase.rpc("create_notification", {
              _user_id: sellerId,
              _type: "shipping_overdue",
              _title: "Shipment overdue",
              _body: `"${item.title ?? "Your item"}" was not shipped within 48 hours and is under admin review.`,
              _link: "/my-listings",
              _audience: "user",
            });
          }
          for (const aid of adminIds) {
            await supabase.rpc("create_notification", {
              _user_id: aid,
              _type: "shipment_overdue",
              _title: "Shipment overdue (48h)",
              _body: `Order ${o.id.slice(0, 8)} — "${item.title ?? "item"}" not shipped.`,
              _link: "/admin/orders",
              _audience: "admin",
            });
          }
        }
      }

      // ---- Delivery confirmation flow (item IS shipped) ----
      if (isShipped && entry.expected_delivery && o.buyer_id) {
        const eta = new Date(entry.expected_delivery).getTime();
        if (Number.isFinite(eta)) {
          // On/after expected delivery date — prompt buyer once
          if (now >= eta && !entry.delivery_prompt_sent_at) {
            await supabase.rpc("create_notification", {
              _user_id: o.buyer_id,
              _type: "delivery_confirm_prompt",
              _title: "Did your order arrive?",
              _body: `Please confirm receipt of "${item.title ?? "your item"}" or raise a quality concern within 12 hours.`,
              _link: "/profile",
              _audience: "user",
            });
            entry.delivery_prompt_sent_at = new Date().toISOString();
            itemStatus[lid] = entry;
            mutated = true;
            deliveryPrompts++;
          }

          // 12h after expected delivery and still no buyer action → auto-complete
          if (now >= eta + DELIVERY_CONFIRM_WINDOW_MS) {
            entry.status = "completed";
            entry.completed_at = new Date().toISOString();
            entry.auto_completed = true;
            itemStatus[lid] = entry;
            mutated = true;
            autoCompletions++;

            if (o.buyer_id) {
              await supabase.rpc("create_notification", {
                _user_id: o.buyer_id,
                _type: "order_auto_completed",
                _title: "Order automatically closed",
                _body: `"${item.title ?? "Your item"}" was marked as received after the 12-hour confirmation window.`,
                _link: "/profile",
                _audience: "user",
              });
            }
            if (sellerId) {
              await supabase.rpc("create_notification", {
                _user_id: sellerId,
                _type: "order_auto_completed",
                _title: "Order completed",
                _body: `"${item.title ?? "Your item"}" was automatically closed after the buyer's confirmation window.`,
                _link: "/profile",
                _audience: "user",
              });
            }
          }
        }
      }
    }

    if (mutated) {
      await supabase.from("orders").update({ item_status: itemStatus }).eq("id", o.id);
    }
  }

  // ---- Reservation expiry sweep ----
  let expiredReservations = 0;
  const { data: expiredListings } = await supabase
    .from("listings")
    .select("id")
    .eq("status", "reserved")
    .lt("reserved_until", new Date().toISOString());
  for (const l of expiredListings ?? []) {
    const { error: rpcErr } = await supabase.rpc("expire_listing_reservation", {
      _listing_id: l.id,
      _force: false,
    });
    if (!rpcErr) expiredReservations++;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      scanned: orders?.length ?? 0,
      reminders24,
      escalations48,
      deliveryPrompts,
      autoCompletions,
      expiredReservations,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
