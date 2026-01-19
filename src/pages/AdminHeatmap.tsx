import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/react-native/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * AdminHeatmap
 * Visualizes active rider density in Aurangabad.
 * Uses real-time data from the 'drivers' table via the shared Supabase client.
 */
export const AdminHeatmap = () => {
  const [activeRiders, setActiveRiders] = useState<any[]>([]);

  useEffect(() => {
    const fetchRiders = async () => {
      const { data } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'online');
      if (data) setActiveRiders(data);
    };

    fetchRiders();

    const channel = supabase
      .channel('admin-heat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
        fetchRiders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 bg-[#0A0A0A] min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter">Sweeftcom Pulse Dashboard</h1>
        <div className="bg-[#E5F942]/10 text-[#E5F942] px-4 py-1 rounded-full border border-[#E5F942]/20">
          Live: {activeRiders.length} Riders Online
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#111] border-[#222] h-[600px] relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-gray-400 text-sm uppercase">Aurangabad Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center">
              <div className="text-center opacity-40">
                <p className="text-xl font-mono">[ HEATMAP ENGINE: AURANGABAD ]</p>
                <div className="mt-4 flex flex-wrap justify-center gap-4 max-w-md">
                   {activeRiders.map(r => (
                     <div key={r.id} className="w-6 h-6 rounded-full bg-[#E5F942] blur-lg animate-pulse" />
                   ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222]">
          <CardHeader>
            <CardTitle className="text-gray-400 text-sm uppercase">Live Logistics Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRiders.map((rider) => (
                <div key={rider.id} className="flex justify-between items-center p-3 rounded-lg bg-[#1a1a1a] border-l-2 border-[#E5F942]">
                  <div>
                    <p className="font-semibold text-white">{rider.name}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{rider.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#E5F942]">GPS: {rider.current_lat?.toFixed(4)}, {rider.current_lng?.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHeatmap;
