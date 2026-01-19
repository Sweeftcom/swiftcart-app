import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/react-native/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Truck, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * OrderHeartbeat
 * Admin monitor to visualize the "10-minute promise" in real-time.
 */
export const OrderHeartbeat = () => {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveOrders();
    const channel = supabase
      .channel('live-heartbeat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchActiveOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        store:stores(name),
        status_history:order_status_history(*)
      `)
      .not('status', 'eq', 'delivered')
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false });

    if (data) setActiveOrders(data);
  };

  const calculateDelay = (createdAt: string, status: string, history: any[]) => {
    const statusEntry = history.find(h => h.status === status);
    if (!statusEntry) return null;
    const diff = (new Date(statusEntry.created_at).getTime() - new Date(createdAt).getTime()) / 1000 / 60;
    return Math.round(diff * 10) / 10;
  };

  return (
    <div className="p-6 bg-[#0A0A0A] min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Pilot War Room: Order Heartbeat</h1>

      <div className="grid grid-cols-1 gap-6">
        {activeOrders.map((order) => {
          const vendorDelay = calculateDelay(order.created_at, 'confirmed', order.status_history);
          const riderDelay = calculateDelay(order.created_at, 'out_for_delivery', order.status_history);

          return (
            <Card key={order.id} className="bg-[#111] border-[#222] text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{order.order_number}</CardTitle>
                  <p className="text-sm text-gray-400">{order.store.name} • {formatDistanceToNow(new Date(order.created_at))} ago</p>
                </div>
                <Badge className={order.status === 'placed' ? 'bg-yellow-500' : 'bg-green-500'}>
                  {order.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#222] -z-10" />

                  {/* Step 1: Placed */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <p className="text-xs mt-2">Placed</p>
                  </div>

                  {/* Step 2: Vendor Accepted */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${vendorDelay ? 'bg-green-500' : 'bg-[#222]'}`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-xs mt-2">Accepted</p>
                    {vendorDelay && (
                      <span className={`text-[10px] ${vendorDelay > 1 ? 'text-red-500' : 'text-gray-500'}`}>
                        {vendorDelay}m
                      </span>
                    )}
                  </div>

                  {/* Step 3: Rider Out */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${riderDelay ? 'bg-blue-500' : 'bg-[#222]'}`}>
                      <Truck size={16} />
                    </div>
                    <p className="text-xs mt-2">Rider Out</p>
                    {riderDelay && (
                      <span className={`text-[10px] ${riderDelay > 5 ? 'text-red-500' : 'text-gray-500'}`}>
                        {riderDelay}m
                      </span>
                    )}
                  </div>

                  {/* BottleNeck Alerts */}
                  <div className="flex gap-2">
                    {order.status === 'placed' && (Date.now() - new Date(order.created_at).getTime()) > 60000 && (
                      <div className="flex items-center gap-1 text-red-500 animate-pulse">
                        <AlertCircle size={14} />
                        <span className="text-xs">VENDOR DELAY!</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
