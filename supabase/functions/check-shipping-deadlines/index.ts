// Scans orders and enforces 48h shipping SLA.
// - 24h after order created and item still not shipped: notify seller (once)
// - 48h after order created and item still not shipped: mark overdue + notify admins (once)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOUR = 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Pull recent non-cancelled orders (last 14 days is enough for 48h SLA)
  const since = new Date(Date.now() - 14 * 24 * HOUR).toISOString();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, created_at, status, items, item_status")
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
  const now = Date.now();

  for (const o of orders ?? []) {
    const createdAt = new Date(o.created_at).getTime();
    const ageH = (now - createdAt) / HOUR;
    if (ageH < 24) continue;

    const itemStatus: Record<string, any> = { ...(o.item_status ?? {}) };
    let mutated = false;

    for (const item of (o.items ?? []) as any[]) {
      const lid = item?.listing_id;
      if (!lid) continue;
      const entry = { ...(itemStatus[lid] ?? {}) };
      const s = (entry.status ?? "").toLowerCase();
      if (s === "shipped" || s === "delivered" || s === "completed" || s === "received") continue;

      // Resolve seller for notifications
      let sellerId: string | undefined = item.seller_id;
      if (!sellerId) {
        const { data: l } = await supabase
          .from("listings")
          .select("seller_id")
          .eq("id", lid)
          .maybeSingle();
        sellerId = l?.seller_id;
      }

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

        // Notify seller again
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
        // Notify admins
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

    if (mutated) {
      await supabase.from("orders").update({ item_status: itemStatus }).eq("id", o.id);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, reminders24, escalations48, scanned: orders?.length ?? 0 }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
