import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/react-native/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, Send, TrendingUp } from 'lucide-react';

/**
 * MarketingDashboard (Web Admin)
 * Scaling tool for coupons and campaign management.
 */
export const MarketingDashboard = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('50');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data);
  };

  const createCoupon = async () => {
    const { error } = await supabase.from('coupons').insert({
      code: code.toUpperCase(),
      discount_type: 'flat',
      discount_value: parseFloat(discount),
      usage_limit: 1000,
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 day default
    });

    if (!error) {
      setCode('');
      fetchCoupons();
    }
  };

  return (
    <div className="p-8 bg-[#0A0A0A] min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Campaign Center</h1>
        <div className="flex gap-4">
          <Button className="bg-[#333] hover:bg-[#444]">Export ROI Report</Button>
          <Button className="bg-[#E5F942] text-black">New Bulk Campaign</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Ticket size={20} className="text-[#E5F942]" />
               Create Coupon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Coupon Code (e.g. PLUS50)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-[#000] border-[#333]"
            />
            <Input
              placeholder="Discount Value (₹)"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="bg-[#000] border-[#333]"
            />
            <Button onClick={createCoupon} className="w-full bg-[#E5F942] text-black hover:bg-[#d4e63a]">
              Generate & Publish
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
           {coupons.map(c => (
             <div key={c.id} className="p-6 bg-[#111] border border-[#222] rounded-2xl flex justify-between items-center">
                <div className="flex gap-6 items-center">
                   <div className="p-3 bg-green-500/10 rounded-full">
                      <Send size={20} className="text-green-500" />
                   </div>
                   <div>
                      <p className="font-mono text-xl font-bold">{c.code}</p>
                      <p className="text-sm text-gray-500">Usage: {c.usage_count} / {c.usage_limit}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-lg font-bold text-[#E5F942]">₹{c.discount_value} OFF</p>
                   <p className="text-xs text-red-400">Expires: {new Date(c.expiry_date).toLocaleDateString()}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
