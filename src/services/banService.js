// src/services/banService.js
import { supabase } from '../supabaseClient';

export const banService = {
  
  // ==================== CHECK BAN STATUS ====================
  async checkDeviceBan(deviceFingerprint, email = null) {
    try {
      console.log('🔍 Checking ban for fingerprint:', deviceFingerprint);
      
      const now = new Date().toISOString();
      
      // Query for active bans
      let query = supabase
        .from('device_bans')
        .select(`
          *,
          ban_appeals(*)
        `)
        .eq('device_fingerprint', deviceFingerprint)
        .or(`banned_until.gt.${now},is_permanent.eq.true`);
      
      // If email provided, also check by email
      if (email) {
        query = supabase
          .from('device_bans')
          .select(`
            *,
            ban_appeals(*)
          `)
          .or(`device_fingerprint.eq.${deviceFingerprint},email.eq.${email}`)
          .or(`banned_until.gt.${now},is_permanent.eq.true`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error checking ban:', error);
        throw error;
      }
      
      console.log('📊 Ban check result:', data);
      
      if (data && data.length > 0) {
        const activeBan = data.find(ban => 
          ban.is_permanent || new Date(ban.banned_until) > new Date()
        );
        
        if (activeBan) {
          return {
            isBanned: true,
            ban: activeBan,
            hasAppeal: activeBan.ban_appeals && activeBan.ban_appeals.length > 0,
            appeal: activeBan.ban_appeals?.[0],
          };
        }
      }
      
      return { isBanned: false };
      
    } catch (error) {
      console.error('❌ Fatal error in checkDeviceBan:', error);
      return { isBanned: false, error: error.message };
    }
  },

  // ==================== BAN DEVICE ====================
  async banDevice(banData) {
    try {
      console.log('🔨 Banning device with data:', banData);
      
      const { data, error } = await supabase
        .from('device_bans')
        .insert([{
          user_id: banData.userId || null,
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
          is_permanent: banData.isPermanent || false,
          reason: banData.reason || 'No reason provided',
          banned_by: banData.bannedBy || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error banning device:', error);
        throw error;
      }
      
      console.log('✅ Device banned successfully:', data);
      
      // Update user profile if userId exists
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
      console.error('❌ Fatal error in banDevice:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== UNBAN DEVICE ====================
  async unbanDevice(banId) {
    try {
      console.log('🔓 Unbanning device ID:', banId);
      
      const { error } = await supabase
        .from('device_bans')
        .update({ 
          banned_until: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', banId);

      if (error) {
        console.error('❌ Error unbanning device:', error);
        throw error;
      }
      
      console.log('✅ Device unbanned successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Fatal error in unbanDevice:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== SUBMIT APPEAL ====================
  async submitAppeal(appealData) {
    try {
      console.log('📝 Submitting appeal:', appealData);
      
      const { data, error } = await supabase
        .from('ban_appeals')
        .insert([{
          device_ban_id: appealData.deviceBanId,
          user_id: appealData.userId,
          appeal_message: appealData.message,
          appeal_status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error submitting appeal:', error);
        throw error;
      }
      
      console.log('✅ Appeal submitted successfully:', data);
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Fatal error in submitAppeal:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== LOGIN ATTEMPT ====================
  async logLoginAttempt(attemptData) {
    try {
      console.log('📋 Logging login attempt:', attemptData.email);
      
      const { error } = await supabase
        .from('login_attempts')
        .insert([{
          email: attemptData.email,
          device_fingerprint: attemptData.deviceFingerprint,
          ip_address: attemptData.ipAddress,
          user_agent: attemptData.userAgent,
          success: attemptData.success || false,
        }]);

      if (error) {
        console.error('❌ Error logging attempt:', error);
        // Don't throw, just log
        return { success: false, error: error.message };
      }
      
      console.log('✅ Login attempt logged');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error in logLoginAttempt:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== GET ALL BANS (ADMIN) ====================
  async getAllBans(page = 1, limit = 10, filters = {}) {
    try {
      const start = (page - 1) * limit;
      
      let query = supabase
        .from('device_bans')
        .select(`
          *,
          user:user_id(email),
          banned_by_user:banned_by(email),
          ban_appeals(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status === 'active') {
        query = query.or('banned_until.gt.NOW(),is_permanent.eq.true');
      } else if (filters.status === 'expired') {
        query = query.lt('banned_until', new Date().toISOString()).eq('is_permanent', false);
      }

      if (filters.search) {
        query = query.or(`device_fingerprint.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query.range(start, start + limit - 1);

      if (error) {
        console.error('❌ Error fetching bans:', error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
      
    } catch (error) {
      console.error('❌ Fatal error in getAllBans:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // ==================== GET BAN BY ID ====================
  async getBanById(banId) {
    try {
      const { data, error } = await supabase
        .from('device_bans')
        .select(`
          *,
          user:user_id(email),
          banned_by_user:banned_by(email),
          ban_appeals(*)
        `)
        .eq('id', banId)
        .single();

      if (error) throw error;
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error getting ban:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== UPDATE APPEAL STATUS ====================
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
      console.error('❌ Error updating appeal:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== TEST CONNECTION ====================
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('device_bans')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      console.log('✅ Database connection successful');
      return { success: true, count: data };
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return { success: false, error: error.message };
    }
  }
};
