import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { HTTPError } from 'ky';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { sendRegisterOtp } from '@/services/auth.service';

const authBaseSchema = z.object({
  dob: z.string(),
  email: z.string().trim().email('Please enter a valid email address.'),
  marketingConsent: z.boolean(),
  name: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  phone: z.string(),
  termsAccepted: z.boolean(),
});

const authSchema = authBaseSchema
  .extend({
    otp: z
      .string()
      .trim()
      .length(6, 'OTP must be exactly 6 characters.')
      .regex(/^[A-Z0-9]{6}$/, 'OTP can only contain numbers and uppercase letters.'),
  })
  .superRefine((data, context) => {
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

function parseRetryAfterSeconds(value: string | null): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 60;
  }

  return Math.ceil(seconds);
}

function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailLocked, setEmailLocked] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const form = useForm<AuthFormValues>({
    defaultValues: {
      dob: '',
      email: '',
      marketingConsent: false,
      name: '',
      otp: '',
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

  const resetSignupVerificationState = () => {
    setOtpSent(false);
    setEmailLocked(false);
    setOtpCooldown(0);
    setEmailExistsError(null);
    setOtpError(null);
    form.setValue('otp', '', { shouldDirty: true });
    form.clearErrors('otp');
  };

  // Already logged in → home
  useEffect(() => {
    if (user)
      navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (otpCooldown <= 0) {
      return;
    }

    const timer = globalThis.setTimeout(() => {
      setOtpCooldown(current => Math.max(0, current - 1));
    }, 1000);

    return () => globalThis.clearTimeout(timer);
  }, [otpCooldown]);

  const handleSendOtp = async () => {
    const isValid = await form.trigger('email');
    if (!isValid) {
      const message = form.formState.errors.email?.message;
      toast({
        description: message ? String(message) : 'Please enter a valid email address.',
        title: 'Validation error',
        variant: 'destructive',
      });
      return;
    }

    setSendingOtp(true);
    setEmailExistsError(null);
    setOtpError(null);

    try {
      await sendRegisterOtp({ email: form.getValues('email').trim() });
      setOtpSent(true);
      setEmailLocked(true);
      setOtpCooldown(60);
      toast({
        description: 'Check your email for the 6-character code.',
        title: otpSent ? 'OTP resent' : 'OTP sent',
      });
    }
    catch (error: unknown) {
      if (error instanceof HTTPError) {
        if (error.response.status === 409) {
          form.setValue('otp', '');
          form.clearErrors('otp');
          setOtpError(null);
          setEmailExistsError('An account with this email already exists.');
          setEmailLocked(false);
          setOtpSent(false);
          setOtpCooldown(0);
          return;
        }

        if (error.response.status === 429) {
          const cooldown = parseRetryAfterSeconds(error.response.headers.get('Retry-After'));
          setOtpCooldown(cooldown);
          toast({
            description: `Please wait ${cooldown} seconds before requesting another OTP.`,
            title: 'OTP resend blocked',
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        title: 'Error',
        variant: 'destructive',
      });
    }
    finally {
      setSendingOtp(false);
    }
  };

  const onSubmit: SubmitHandler<AuthFormValues> = async (values) => {
    setLoading(true);
    setOtpError(null);

    try {
      if (mode === 'register') {
        if (!otpSent) {
          toast({
            description: 'Send an OTP to your email before creating an account.',
            title: 'OTP required',
            variant: 'destructive',
          });
          return;
        }

        await signUp({
          dateOfBirth: values.dob,
          email: values.email.trim(),
          fullName: values.name,
          marketingEmailConsent: values.marketingConsent,
          otp: values.otp.trim().toUpperCase(),
          password: values.password,
          phone: values.phone.trim(),
          termsAccepted: true,
        });

        trackEvent('sign_up', {
          marketing_consent: values.marketingConsent,
          method: 'email',
        });

        toast({
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
    catch (error: unknown) {
      if (mode === 'register' && error instanceof HTTPError && error.response.status === 401) {
        const message = 'Invalid or expired OTP.';
        setOtpError(message);
        toast({
          description: message,
          title: 'Error',
          variant: 'destructive',
        });
        return;
      }

      toast({
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
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

  const sendOtpButtonLabel = sendingOtp
    ? 'Sending...'
    : otpCooldown > 0
      ? `${otpSent ? 'Resend OTP' : 'Send OTP'} (${otpCooldown}s)`
      : otpSent ? 'Resend OTP' : 'Send OTP';

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
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="email"
                          placeholder="you@example.com"
                          readOnly={mode === 'register' && emailLocked}
                          type="email"
                          {...field}
                          onChange={(event) => {
                            field.onChange(event);
                            if (mode === 'register') {
                              setEmailExistsError(null);
                            }
                          }}
                        />
                      )}
                    />
                  </div>
                  {mode === 'register' && (
                    <Button
                      onClick={handleSendOtp}
                      disabled={sendingOtp || loading || otpCooldown > 0}
                      type="button"
                      variant="outline"
                    >
                      {sendOtpButtonLabel}
                    </Button>
                  )}
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                {mode === 'register' && emailExistsError && (
                  <p className="text-sm text-destructive">
                    {emailExistsError}
                    {' '}
                    <Link to="/forgot-password" className="underline">
                      Forgot password?
                    </Link>
                  </p>
                )}
                {mode === 'register' && emailLocked && (
                  <button
                    onClick={resetSignupVerificationState}
                    type="button"
                    className="
                      text-sm font-medium text-primary
                      hover:underline
                    "
                  >
                    Change email
                  </button>
                )}
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
                {mode === 'login' && (
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="
                        text-sm font-medium text-primary
                        hover:underline
                      "
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <>
                  {otpSent && (
                    <div className="space-y-2">
                      <Label htmlFor="otp">OTP Code</Label>
                      <Controller
                        name="otp"
                        control={control}
                        render={({ field }) => (
                          <InputOTP
                            id="otp"
                            onChange={(value) => {
                              setOtpError(null);
                              field.onChange(value.replaceAll(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 6));
                            }}
                            value={field.value}
                            maxLength={6}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        )}
                      />
                      {errors.otp && <p className="text-sm text-destructive">{errors.otp.message}</p>}
                      {!errors.otp && otpError && <p className="text-sm text-destructive">{otpError}</p>}
                    </div>
                  )}
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
                </>
              )}

              <Button
                disabled={loading || (mode === 'register' && !otpSent)}
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
                        onClick={() => {
                          setMode('register');
                          resetSignupVerificationState();
                        }}
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
                        onClick={() => {
                          setMode('login');
                          resetSignupVerificationState();
                        }}
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
