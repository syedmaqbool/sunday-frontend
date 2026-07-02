import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { HTTPError } from 'ky';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { forgotPassword, resetPassword } from '@/services/auth.service';

const forgotPasswordSchema = z.object({
  confirmPassword: z.string(),
  email: z.string().trim().email('Please enter a valid email address.'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 characters.')
    .regex(/^[A-Z0-9]{6}$/, 'OTP can only contain numbers and uppercase letters.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
}).superRefine((data, context) => {
  if (data.password !== data.confirmPassword) {
    context.addIssue({
      path: ['confirmPassword'],
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match.',
    });
  }
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPassword() {
  const [sendingCode, setSendingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [emailLocked, setEmailLocked] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      otp: '',
      password: '',
    },
    mode: 'all',
    resolver: zodResolver(forgotPasswordSchema),
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = form;

  const resetVerificationState = () => {
    setCodeSent(false);
    setEmailLocked(false);
    setOtpError(null);
    form.setValue('otp', '', { shouldDirty: true });
    form.clearErrors('otp');
  };

  const handleSendCode = async () => {
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

    setSendingCode(true);
    setOtpError(null);

    try {
      const response = await forgotPassword({ email: form.getValues('email').trim() });
      setCodeSent(true);
      setEmailLocked(true);
      toast({
        description: response.message ?? 'If the account exists, reset instructions were sent.',
        title: 'Reset code sent',
      });
    }
    catch (error: unknown) {
      toast({
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        title: 'Error',
        variant: 'destructive',
      });
    }
    finally {
      setSendingCode(false);
    }
  };

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (values) => {
    if (!codeSent) {
      toast({
        description: 'Send a reset code before submitting a new password.',
        title: 'Reset code required',
        variant: 'destructive',
      });
      return;
    }

    setResettingPassword(true);
    setOtpError(null);

    try {
      const response = await resetPassword({
        email: values.email.trim(),
        otp: values.otp.trim().toUpperCase(),
        password: values.password,
      });

      toast({
        description: response.message ?? 'Password reset successfully.',
        title: 'Password updated',
      });
      navigate('/auth');
    }
    catch (error: unknown) {
      if (error instanceof HTTPError && error.response.status === 401) {
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
      setResettingPassword(false);
    }
  };

  const onInvalid = () => {
    const firstError = Object.values(errors)[0]?.message;
    if (!firstError) {
      return;
    }

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
              Reset your password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Send a reset code to your email, then set a new password.
            </p>

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-4">
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
                          readOnly={emailLocked}
                          type="email"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  <Button
                    onClick={handleSendCode}
                    disabled={sendingCode || resettingPassword}
                    type="button"
                    variant="outline"
                  >
                    {sendingCode ? 'Sending...' : codeSent ? 'Resend Code' : 'Send Code'}
                  </Button>
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                {emailLocked && (
                  <button
                    onClick={resetVerificationState}
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

              {codeSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Reset Code</Label>
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

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="confirmPassword"
                      minLength={8}
                      placeholder="••••••••"
                      type="password"
                      {...field}
                    />
                  )}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <Button
                disabled={resettingPassword || !codeSent}
                size="lg"
                type="submit"
                className="w-full"
              >
                {resettingPassword ? 'Please wait...' : 'Reset Password'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Remembered your password?
              {' '}
              <Link
                to="/auth"
                className="
                  font-medium text-primary
                  hover:underline
                "
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

export default ForgotPassword;
