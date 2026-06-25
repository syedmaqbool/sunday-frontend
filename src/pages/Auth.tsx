import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  // Already logged in → home
  useEffect(() => {
    if (user)
      navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event_: React.FormEvent) => {
    event_.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        // ── Client-side validation (same as before) ──────────────────────
        if (!termsAccepted) {
          toast({
            description: 'Please accept the Terms & Conditions to continue.',
            title: 'Terms required',
            variant: 'destructive',
          });
          return;
        }

        const dobDate = new Date(dob);
        if (Number.isNaN(dobDate.getTime()) || dobDate >= new Date()) {
          toast({
            description: 'Please enter a valid date.',
            title: 'Invalid date of birth',
            variant: 'destructive',
          });
          return;
        }
        const age
          = (Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 13) {
          toast({
            description: 'You must be at least 13 years old.',
            title: 'Age requirement',
            variant: 'destructive',
          });
          return;
        }
        if (!/^\+?[\d\s\-().]{7,20}$/.test(phone.trim())) {
          toast({
            description: 'Please enter a valid phone number.',
            title: 'Invalid phone',
            variant: 'destructive',
          });
          return;
        }

        // ── Register API call ─────────────────────────────────────────────
        await signUp({
          dateOfBirth: dob,
          email,
          fullName: name,
          marketingEmailConsent: marketingConsent,
          password,
          phone: phone.trim(),
          termsAccepted: true,
        });

        trackEvent('sign_up', {
          marketing_consent: marketingConsent,
          method: 'email',
        });

        // Backend OTP email bhejta hai — Supabase wala redirect nahi
        toast({
          description: 'Please check your email for a verification code.',
          title: 'Account created!',
        });

        // Register ke baad seedha preferences onboarding pe
        navigate('/preferences');
      }
      else {
        // ── Login API call ────────────────────────────────────────────────
        const data = await signIn(email, password);

        trackEvent('login', { method: 'email' });

        // Onboarding check — preferences ab login response mein hi aata hai,
        // alag Supabase query ki zaroorat nahi
        const onboardingDone = (data.preferences as any)?.onboarding_completed;

        if (onboardingDone) {
          toast({ title: 'Welcome back!' });
          navigate('/');
        }
        else {
          navigate('/preferences');
        }
      }
    }
    catch (error: any) {
      // API layer already throws Error with the backend message
      toast({
        description: error?.message ?? 'Something went wrong. Please try again.',
        title: 'Error',
        variant: 'destructive',
      });
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex flex-1 items-center justify-center py-16">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="rounded-xl border border-border bg-card p-8">
            <h1 className="font-heading text-2xl font-bold text-card-foreground">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Sign in to your account'
                : 'Join the fashion marketplace'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'register' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      onChange={event => setName(event.target.value)}
                      value={name}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      onChange={event => setPhone(event.target.value)}
                      value={phone}
                      maxLength={20}
                      placeholder="+92 ..."
                      required
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      onChange={event => setDob(event.target.value)}
                      value={dob}
                      max={new Date().toISOString().split('T', 1)[0]}
                      required
                      type="date"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  onChange={event => setEmail(event.target.value)}
                  value={email}
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  onChange={event => setPassword(event.target.value)}
                  value={password}
                  minLength={8}
                  placeholder="••••••••"
                  required
                  type="password"
                />
              </div>

              {mode === 'register' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      onCheckedChange={checked =>
                        setTermsAccepted(checked === true)}
                      checked={termsAccepted}
                      required
                    />
                    <Label
                      htmlFor="terms"
                      className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground"
                    >
                      I agree to the
                      {' '}
                      <Link
                        target="_blank"
                        to="/terms"
                        className="
                          text-primary underline
                          hover:text-primary/80
                        "
                      >
                        Terms & Conditions
                      </Link>
                      {' '}
                      and understand that my account may be suspended if I
                      violate them.
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="marketing"
                      onCheckedChange={checked =>
                        setMarketingConsent(checked === true)}
                      checked={marketingConsent}
                    />
                    <Label
                      htmlFor="marketing"
                      className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground"
                    >
                      I would like to receive marketing emails about new
                      arrivals, promotions, and platform updates. (Optional)
                    </Label>
                  </div>
                </div>
              )}

              <Button
                disabled={loading}
                size="lg"
                type="submit"
                className="w-full"
              >
                {loading
                  ? 'Please wait...'
                  : (mode === 'login'
                      ? 'Sign In'
                      : 'Create Account')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'login'
                ? (
                    <>
                      Don't have an account?
                      {' '}
                      <button
                        onClick={() => setMode('register')}
                        className="
                          font-medium text-primary
                          hover:underline
                        "
                      >
                        Sign up
                      </button>
                    </>
                  )
                : (
                    <>
                      Already have an account?
                      {' '}
                      <button
                        onClick={() => setMode('login')}
                        className="
                          font-medium text-primary
                          hover:underline
                        "
                      >
                        Sign in
                      </button>
                    </>
                  )}
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

export default Auth;
