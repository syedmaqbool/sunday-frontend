import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

const authBaseSchema = z.object({
  dob: z.string(),
  email: z.string().trim().email('Please enter a valid email address.'),
  marketingConsent: z.boolean(),
  name: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  phone: z.string(),
  termsAccepted: z.boolean(),
});

const authSchema = authBaseSchema.superRefine((data, context) => {
  if (!data.name.trim()) {
    context.addIssue({
      path: ['name'],
      code: z.ZodIssueCode.custom,
      message: 'Full name is required.',
    });
  }

  if (!/^\+?[\d\s\-().]{7,20}$/.test(data.phone.trim())) {
    context.addIssue({
      path: ['phone'],
      code: z.ZodIssueCode.custom,
      message: 'Please enter a valid phone number.',
    });
  }

  const dobDate = new Date(data.dob);
  if (Number.isNaN(dobDate.getTime()) || dobDate >= new Date()) {
    context.addIssue({
      path: ['dob'],
      code: z.ZodIssueCode.custom,
      message: 'Please enter a valid date.',
    });
  }
  else {
    const age = (Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 13) {
      context.addIssue({
        path: ['dob'],
        code: z.ZodIssueCode.custom,
        message: 'You must be at least 13 years old.',
      });
    }
  }

  if (!data.termsAccepted) {
    context.addIssue({
      path: ['termsAccepted'],
      code: z.ZodIssueCode.custom,
      message: 'Please accept the Terms & Conditions to continue.',
    });
  }
});

const loginSchema = authBaseSchema.pick({
  email: true,
  password: true,
});

type AuthFormValues = z.infer<typeof authSchema>;

function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const form = useForm<AuthFormValues>({
    defaultValues: {
      dob: '',
      email: '',
      marketingConsent: false,
      name: '',
      password: '',
      phone: '',
      termsAccepted: false,
    },
    mode: 'all',
    resolver: zodResolver(mode === 'register' ? authSchema : loginSchema),
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = form;

  // Already logged in → home
  useEffect(() => {
    if (user)
      navigate('/', { replace: true });
  }, [user, navigate]);

  const onSubmit: SubmitHandler<AuthFormValues> = async (values) => {
    setLoading(true);

    try {
      if (mode === 'register') {
        await signUp({
          dateOfBirth: values.dob,
          email: values.email,
          fullName: values.name,
          marketingEmailConsent: values.marketingConsent,
          password: values.password,
          phone: values.phone.trim(),
          termsAccepted: true,
        });

        trackEvent('sign_up', {
          marketing_consent: values.marketingConsent,
          method: 'email',
        });

        toast({
          description: 'Please check your email for a verification code.',
          title: 'Account created!',
        });

        navigate('/preferences');
      }
      else {
        const data = await signIn(values.email, values.password);

        trackEvent('login', { method: 'email' });

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

  const onInvalid = () => {
    const firstError = Object.values(errors)[0]?.message;
    if (!firstError)
      return;

    toast({
      description: String(firstError),
      title: 'Validation error',
      variant: 'destructive',
    });
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

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-4">
              {mode === 'register' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="name"
                          placeholder="Your name"
                          {...field}
                        />
                      )}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="phone"
                          maxLength={20}
                          placeholder="+92 ..."
                          type="tel"
                          {...field}
                        />
                      )}
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Controller
                      name="dob"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="dob"
                          max={new Date().toISOString().split('T', 1)[0]}
                          type="date"
                          {...field}
                        />
                      )}
                    />
                    {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="email"
                      placeholder="you@example.com"
                      type="email"
                      {...field}
                    />
                  )}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="password"
                      minLength={8}
                      placeholder="••••••••"
                      type="password"
                      {...field}
                    />
                  )}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              {mode === 'register' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-2">
                    <Controller
                      name="termsAccepted"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="terms"
                          onCheckedChange={checked => field.onChange(checked === true)}
                          checked={field.value}
                        />
                      )}
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
                  {errors.termsAccepted && <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>}
                  <div className="flex items-start gap-2">
                    <Controller
                      name="marketingConsent"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="marketing"
                          onCheckedChange={checked => field.onChange(checked === true)}
                          checked={field.value}
                        />
                      )}
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
