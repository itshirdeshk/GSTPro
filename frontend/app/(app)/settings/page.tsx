'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Shield, Bell, Palette, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiGet, apiPut } from '@/lib/api';
import type { Tenant } from '@/lib/types';
import toast from 'react-hot-toast';

const settingsTabs = [
  { key: 'company', label: 'Company' },
  { key: 'security', label: 'Security' },
  { key: 'notifications', label: 'Notifications' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('company');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold">Settings</h2>
        <p className="text-sm text-text3">Manage your account and preferences</p>
      </div>

      <Tabs tabs={settingsTabs} activeTab={tab} onChange={setTab} />

      {tab === 'company' && <CompanySettings />}
      {tab === 'security' && <SecuritySettings />}
      {tab === 'notifications' && <NotificationSettings />}
    </div>
  );
}

function CompanySettings() {
  const queryClient = useQueryClient();
  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => apiGet<Tenant>('/tenant'),
    retry: false,
  });

  const [form, setForm] = useState({
    businessName: '',
    gstin: '',
    pan: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    businessType: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setForm({
        businessName: tenant.businessName || '',
        gstin: tenant.gstin || '',
        pan: tenant.pan || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
        address: tenant.address || '',
        city: tenant.city || '',
        state: tenant.state || '',
        pincode: tenant.pincode || '',
        businessType: tenant.businessType || '',
        website: tenant.website || '',
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPut('/tenant', form);
      toast.success('Company info updated');
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent2">
          <Building2 size={20} />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold">Company Information</h3>
          <p className="text-sm text-text3">Update your business details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="businessName" label="Company Name" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required />
          <Input id="gstin" label="GSTIN" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} placeholder="22AAAAA0000A1Z5" />
          <Input id="pan" label="PAN" value={form.pan} onChange={(e) => set('pan', e.target.value)} />
          <Input id="phone" label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input id="businessType" label="Business Type" value={form.businessType} onChange={(e) => set('businessType', e.target.value)} />
          <Input id="address" label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} className="sm:col-span-2" />
          <Input id="city" label="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
          <Input id="state" label="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
          <Input id="pincode" label="Pincode" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
          <Input id="website" label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={loading}>Save Changes</Button>
        </div>
      </form>
    </Card>
  );
}

function SecuritySettings() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiPut('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent2">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold">Change Password</h3>
            <p className="text-sm text-text3">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Input
            id="currentPassword"
            label="Current Password"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
          />
          <Input
            id="newPassword"
            label="New Password"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
          />
          <Input
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          <Button type="submit" loading={loading}>Update Password</Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red/30!">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red/10 flex items-center justify-center text-red">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-red">Danger Zone</h3>
            <p className="text-sm text-text3">Irreversible actions</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-red/5 rounded-lg border border-red/20">
          <div>
            <p className="font-medium">Sign out of all devices</p>
            <p className="text-sm text-text3">This will log you out everywhere</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    paymentReminders: true,
    lowStockAlerts: true,
    gstFiling: true,
    weeklyReports: false,
  });

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent2">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold">Notification Preferences</h3>
          <p className="text-sm text-text3">Control what alerts you receive</p>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Get notified when payments are due or overdue' },
          { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Alert when products fall below threshold' },
          { key: 'gstFiling', label: 'GST Filing Reminders', desc: 'Monthly reminders for GST return filing' },
          { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly business summary via email' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-bg3 rounded-lg">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-text3">{item.desc}</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings[item.key as keyof typeof settings] ? 'bg-accent' : 'bg-border'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  settings[item.key as keyof typeof settings] ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
