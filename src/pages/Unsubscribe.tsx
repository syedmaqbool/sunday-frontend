import ky from 'ky';
import { CheckCircle2, Loader2, MailX, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State
  = | { kind: 'already' }
    | { kind: 'error'; message: string }
    | { kind: 'invalid'; message: string }
    | { kind: 'loading' }
    | { kind: 'submitting' }
    | { kind: 'success' }
    | { kind: 'valid' };

function Unsubscribe() {
  const [parameters] = useSearchParams();
  const token = parameters.get('token');
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid', message: 'Missing unsubscribe token.' });
      return;
    }
    (async () => {
      try {
        const data = await ky
          .get(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
            headers: { apikey: SUPABASE_ANON_KEY },
            searchParams: { token },
          })
          .json<any>();
        if (data?.valid) {
          setState({ kind: 'valid' });
        }
        else if (data?.reason === 'already_unsubscribed') {
          setState({ kind: 'already' });
        }
        else {
          setState({
            kind: 'invalid',
            message: data?.error ?? 'Invalid token.',
          });
        }
      }
      catch {
        setState({ kind: 'invalid', message: 'Could not validate token.' });
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token)
      return;
    setState({ kind: 'submitting' });
    try {
      const { data, error } = await supabase.functions.invoke(
        'handle-email-unsubscribe',
        {
          body: { token },
        },
      );
      if (error)
        throw error;
      if (data?.success) {
        setState({ kind: 'success' });
      }
      else if (data?.reason === 'already_unsubscribed') {
        setState({ kind: 'already' });
      }
      else {
        setState({
          kind: 'error',
          message: data?.error ?? 'Failed to unsubscribe.',
        });
      }
    }
    catch (error: any) {
      setState({
        kind: 'error',
        message: error?.message ?? 'Failed to unsubscribe.',
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
          {state.kind === 'loading' && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Validating your link…
              </p>
            </>
          )}
          {state.kind === 'valid' && (
            <>
              <MailX className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">
                Unsubscribe?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You'll stop receiving emails from us. You can re-enable them by
                contacting support.
              </p>
              <Button onClick={handleConfirm} className="mt-6 w-full">
                Confirm unsubscribe
              </Button>
            </>
          )}
          {state.kind === 'submitting' && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Processing…</p>
            </>
          )}
          {state.kind === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">
                You're unsubscribed
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You will no longer receive emails from us.
              </p>
            </>
          )}
          {state.kind === 'already' && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">
                Already unsubscribed
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This email address is already opted out.
              </p>
            </>
          )}
          {(state.kind === 'invalid' || state.kind === 'error') && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-4 font-heading text-2xl font-semibold">
                Something went wrong
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {staterror.message}
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Unsubscribe;
