import { supabase } from '../supabaseClient';

export const banService = {
  // Check if device is banned
  async checkDeviceBan(deviceFingerprint, email = null) {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('device_bans')
        .select('*, ban_appeals(*)')
        .or(`device_fingerprint.eq.${deviceFingerprint}${email ? `,email.eq.${email}` : ''}`)
        .or(`banned_until.gt.${now},is_permanent.eq.true`)
        .order('banned_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const ban = data[0];
        const isActive = ban.is_permanent || new Date(ban.banned_until) > new Date();
        
        if (isActive) {
          return {
            isBanned: true,
            ban: ban,
            hasAppeal: ban.ban_appeals && ban.ban_appeals.length > 0,
            appeal: ban.ban_appeals?.[0],
          };
        }
      }

      return { isBanned: false };
    } catch (error) {
      console.error('Error checking device ban:', error);
      return { isBanned: false, error: error.message };
    }
  },

  // Ban a device
  async banDevice(banData) {
    try {
      const { data, error } = await supabase
        .from('device_bans')
        .insert([{
          user_id: banData.userId,
          device_fingerprint: banData.deviceFingerprint,
          ip_address: banData.ipAddress,
          user_agent: banData.userAgent,
          platform: banData.platform,
          browser: banData.browser,
          os: banData.os,
          screen_resolution: banData.screenResolution,
          languages: banData.languages,
          timezone: banData.timezone,
          banned_until: banData.bannedUntil,
          is_permanent: banData.isPermanent,
          reason: banData.reason,
          banned_by: banData.bannedBy,
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Update user's profile with device info
      if (banData.userId) {
        await supabase
          .from('profiles')
          .update({
            last_device_fingerprint: banData.deviceFingerprint,
            last_ip_address: banData.ipAddress,
          })
          .eq('id', banData.userId);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error banning device:', error);
      return { success: false, error: error.message };
    }
  },

  // Unban a device
  async unbanDevice(banId) {
    try {
      const { error } = await supabase
        .from('device_bans')
        .update({ banned_until: new Date().toISOString() })
        .eq('id', banId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unbanning device:', error);
      return { success: false, error: error.message };
    }
  },

  // Submit appeal
  async submitAppeal(appealData) {
    try {
      const { data, error } = await supabase
        .from('ban_appeals')
        .insert([{
          device_ban_id: appealData.deviceBanId,
          user_id: appealData.userId,
          appeal_message: appealData.message,
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting appeal:', error);
      return { success: false, error: error.message };
    }
  },

  // Update appeal status
  async updateAppealStatus(appealId, status, adminResponse, respondedBy) {
    try {
      const { error } = await supabase
        .from('ban_appeals')
        .update({
          appeal_status: status,
          admin_response: adminResponse,
          responded_by: respondedBy,
          responded_at: new Date().toISOString(),
        })
        .eq('id', appealId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating appeal:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all bans (admin only)
  async getAllBans(page = 1, limit = 10) {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error, count } = await supabase
        .from('device_bans')
        .select(`
          *,
          user:user_id(email, profiles!inner(full_name)),
          banned_by_user:profiles!banned_by(full_name),
          ban_appeals(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      return {
        success: true,
        data,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error fetching bans:', error);
      return { success: false, error: error.message };
    }
  },

  // Log login attempt
  async logLoginAttempt(attemptData) {
    try {
      const { error } = await supabase
        .from('login_attempts')
        .insert([{
          email: attemptData.email,
          device_fingerprint: attemptData.deviceFingerprint,
          ip_address: attemptData.ipAddress,
          user_agent: attemptData.userAgent,
          success: attemptData.success,
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error logging login attempt:', error);
      return { success: false, error: error.message };
    }
  },
};
