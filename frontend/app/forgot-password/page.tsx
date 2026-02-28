'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] bg-bg2 rounded-2xl p-10 border border-border animate-slide-up">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-cyan flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <span className="font-heading text-2xl font-bold">GSTPro</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="font-heading text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-text3 mb-6">We&apos;ve sent a password reset link to <span className="text-text">{email}</span></p>
            <Link href="/login">
              <Button variant="secondary" className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold text-center mb-2">Forgot password?</h1>
            <p className="text-text3 text-center mb-8">Enter your email and we&apos;ll send a reset link</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@company.com"
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={loading} className="w-full mt-2">
                Send Reset Link
              </Button>
            </form>
            <p className="text-center text-sm text-text3 mt-6">
              Remember your password?{' '}
              <Link href="/login" className="text-accent2 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
