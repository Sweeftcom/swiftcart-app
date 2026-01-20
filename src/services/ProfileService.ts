import { supabase } from '../lib/react-native/supabase-client';

/**
 * ProfileService
 * Logic to sync profile edits and location persistence.
 */
export class ProfileService {
  /**
   * Update User Profile (Name, Aadhar, PAN, etc.)
   */
  static async updateProfile(userId: string, data: any) {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  /**
   * Save pinned location from Google Places
   */
  static async saveLocation(userId: string, lat: number, lng: number, address: string) {
    const { error } = await supabase
      .from('profiles')
      .update({
        last_lat: lat,
        last_lng: lng,
        full_address: address,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  /**
   * Document Upload for Riders (Aadhar/PAN)
   */
  static async uploadDocument(userId: string, file: any, docType: 'aadhar' | 'pan') {
    const fileName = `${userId}/${docType}_${Date.now()}`;
    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);

    const updateField = docType === 'aadhar' ? { aadhar_url: publicUrl } : { pan_url: publicUrl };

    await supabase
      .from('drivers')
      .update(updateField)
      .eq('user_id', userId);

    return publicUrl;
  }
}
