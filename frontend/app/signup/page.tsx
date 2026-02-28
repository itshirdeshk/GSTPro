'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiPost } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<AuthResponse>('/auth/signup', {
        name: form.name,
        email: form.email,
        password: form.password,
        businessName: form.businessName,
      });
      login(res.user, res.token);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Signup failed';
      toast.error(msg);
      if (err.response?.data?.details) {
        setErrors(err.response.data.details);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-110 bg-bg2 rounded-2xl p-10 border border-border animate-slide-up relative">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-cyan flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <span className="font-heading text-2xl font-bold">GSTPro</span>
        </div>

        <h1 className="font-heading text-2xl font-bold text-center mb-2">Create account</h1>
        <p className="text-text3 text-center mb-8">Start managing your GST billing</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="businessName"
            label="Company Name"
            placeholder="Your Business Pvt Ltd"
            icon={<Building2 size={16} />}
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            error={errors.businessName}
            required
          />
          <Input
            id="name"
            label="Full Name"
            placeholder="John Doe"
            icon={<User size={16} />}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@company.com"
            icon={<Mail size={16} />}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min 8 characters"
            icon={<Lock size={16} />}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            required
          />
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            icon={<Lock size={16} />}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            required
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-text3 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent2 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
