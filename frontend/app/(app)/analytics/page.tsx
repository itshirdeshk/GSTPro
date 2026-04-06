'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { EcommerceDashboard } from '@/components/analytics/ecommerce-dashboard';
import { RestaurantDashboard } from '@/components/analytics/restaurant-dashboard';
import { SalesValidation } from '@/components/analytics/sales-validation';
import { AIChatbot } from '@/components/analytics/ai-chatbot';
import { LayoutGrid, ShoppingCart, Utensils, ShieldCheck } from 'lucide-react';
import { ecommerceStats, restaurantStats, reconciliationData } from '@/lib/mock-data/analytics';

const tabs = [
  { key: 'ecommerce', label: 'E-Commerce' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'reconciliation', label: 'Sales Validation' },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('ecommerce');

  const renderContent = () => {
    switch (activeTab) {
      case 'ecommerce':
        return <EcommerceDashboard />;
      case 'restaurant':
        return <RestaurantDashboard />;
      case 'reconciliation':
        return <SalesValidation />;
      default:
        return null;
    }
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'ecommerce':
        return {
          title: 'E-Commerce Seller Analytics',
          description: 'Track performance across Flipkart, Amazon, Meesho, and more.',
          icon: <ShoppingCart className="w-6 h-6 text-accent2" />,
        };
      case 'restaurant':
        return {
          title: 'Restaurant Owner Analytics',
          description: 'Monitor daily sales from Swiggy, Zomato, and POS.',
          icon: <Utensils className="w-6 h-6 text-green" />,
        };
      case 'reconciliation':
        return {
          title: 'Cross-Platform Sales Validation',
          description: 'Reconcile platform payouts with your bank statements.',
          icon: <ShieldCheck className="w-6 h-6 text-amber" />,
        };
      default:
        return {
          title: 'Analytics Overview',
          description: 'Manage your multi-channel business insights.',
          icon: <LayoutGrid className="w-6 h-6 text-accent2" />,
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shadow-sm">
            {header.icon}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-text1">{header.title}</h1>
            <p className="text-sm text-text3">{header.description}</p>
          </div>
        </div>
        
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="w-full md:w-auto"
        />
      </div>

      <div className="min-h-[600px]">
        {renderContent()}
      </div>

      <AIChatbot 
        analyticsData={{ 
          ecommerce: ecommerceStats, 
          restaurant: restaurantStats, 
          reconciliation: reconciliationData 
        }} 
      />
    </div>
  );
}
