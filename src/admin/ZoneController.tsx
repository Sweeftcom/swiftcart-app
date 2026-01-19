import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/react-native/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * ZoneController (Web Admin)
 * Manage virtual fences and zone-based delivery fees.
 */
export const ZoneController = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneFee, setNewZoneFee] = useState('20');

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    const { data } = await supabase.from('zones').select('*');
    if (data) setZones(data);
  };

  const createZone = async () => {
    // Conceptual: In a real UI, use Leaflet.draw or Google Maps drawing tools to get the polygon
    // Mocking a CIDCO polygon for this action
    const cidcoPolygon = 'POLYGON((75.36 19.88, 75.37 19.88, 75.37 19.89, 75.36 19.89, 75.36 19.88))';

    const { error } = await supabase.from('zones').insert({
      name: newZoneName,
      base_delivery_fee: parseFloat(newZoneFee),
      // In PostGIS we would use: ST_GeomFromText(cidcoPolygon, 4326)
      // For this mock we insert the name and fee
    });

    if (!error) {
      setNewZoneName('');
      fetchZones();
    }
  };

  return (
    <div className="p-8 bg-[#0A0A0A] min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Logistics Zone Controller</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-[#111] border-[#222] text-white">
          <CardHeader>
            <CardTitle>Create New Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Zone Name (e.g., CIDCO N-Series)"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="bg-[#000] border-[#333]"
            />
            <Input
              placeholder="Base Delivery Fee (₹)"
              type="number"
              value={newZoneFee}
              onChange={(e) => setNewZoneFee(e.target.value)}
              className="bg-[#000] border-[#333]"
            />
            <Button onClick={createZone} className="w-full bg-[#E5F942] text-black hover:bg-[#d4e63a]">
              Draw & Save Zone
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
          {zones.map(zone => (
            <div key={zone.id} className="p-6 rounded-2xl bg-[#111] border border-[#222] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{zone.name}</h3>
                <p className="text-gray-500">Base Delivery: ₹{zone.base_delivery_fee}</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="border-[#333] text-white">Edit Polygon</Button>
                <Button variant="destructive">Deactivate</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
