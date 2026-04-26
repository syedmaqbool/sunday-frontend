import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid"; message: string }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid", message: "Missing unsubscribe token." });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (data?.valid) setState({ kind: "valid" });
        else if (data?.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid", message: data?.error ?? "Invalid token." });
      } catch {
        setState({ kind: "invalid", message: "Could not validate token." });
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState({ kind: "success" });
      else if (data?.reason === "already_unsubscribed") setState({ kind: "already" });
      else setState({ kind: "error", message: data?.error ?? "Failed to unsubscribe." });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "Failed to unsubscribe." });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
          {state.kind === "loading" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Validating your link…</p>
            </>
          )}
          {state.kind === "valid" && (
            <>
              <MailX className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">Unsubscribe?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You'll stop receiving emails from us. You can re-enable them by contacting support.
              </p>
              <Button className="mt-6 w-full" onClick={handleConfirm}>
                Confirm unsubscribe
              </Button>
            </>
          )}
          {state.kind === "submitting" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Processing…</p>
            </>
          )}
          {state.kind === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">You're unsubscribed</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You will no longer receive emails from us.
              </p>
            </>
          )}
          {state.kind === "already" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">Already unsubscribed</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This email address is already opted out.
              </p>
            </>
          )}
          {(state.kind === "invalid" || state.kind === "error") && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">Something went wrong</h1>
              <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
