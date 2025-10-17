import { supabase } from '../lib/supabase';

export interface ActiveSession {
  id: string;
  user_id: string;
  session_id: string;
  device_info: string;
  ip_address: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

class SessionManager {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentSessionId: string | null = null;

  async checkExistingSession(userId: string, currentSessionId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('session_id', currentSessionId);

      if (error) {
        console.error('Lỗi kiểm tra session:', error);
        return false;
      }

      return !!(data && data.length > 0);
    } catch (err) {
      console.error('Lỗi:', err);
      return false;
    }
  }

  async createSession(userId: string, sessionId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const deviceInfo = this.getDeviceInfo();
      const ipAddress = await this.getIPAddress();

      console.log('🔄 Tạo session mới, vô hiệu hóa các session cũ...');

      await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('session_id', sessionId);

      const { error: insertError } = await supabase
        .from('active_sessions')
        .upsert([{
          user_id: userId,
          session_id: sessionId,
          device_info: deviceInfo,
          ip_address: ipAddress,
          is_active: true,
          last_activity: new Date().toISOString()
        }], {
          onConflict: 'session_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Lỗi tạo session:', insertError);
        return false;
      }

      console.log('✅ Session được tạo thành công');

      this.currentSessionId = sessionId;
      this.startHeartbeat(userId, sessionId);
      return true;
    } catch (err) {
      console.error('Lỗi:', err);
      return false;
    }
  }

  async endSession(userId: string, sessionId: string): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('session_id', sessionId);

      this.stopHeartbeat();
      this.currentSessionId = null;
    } catch (err) {
      console.error('Lỗi kết thúc session:', err);
    }
  }

  private startHeartbeat(userId: string, sessionId: string): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(async () => {
      if (!supabase) return;

      try {
        const { data: session } = await supabase
          .from('active_sessions')
          .select('is_active')
          .eq('user_id', userId)
          .eq('session_id', sessionId)
          .maybeSingle();

        if (!session || !session.is_active) {
          window.dispatchEvent(new CustomEvent('sessionTerminated'));
          this.stopHeartbeat();
          return;
        }

        await supabase
          .from('active_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('session_id', sessionId);
      } catch (err) {
        console.error('Lỗi heartbeat:', err);
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    let device = 'Unknown';

    if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
      device = 'Mobile';
    } else if (/Tablet|iPad/i.test(ua)) {
      device = 'Tablet';
    } else {
      device = 'Desktop';
    }

    const browser = this.getBrowser(ua);
    return `${device} - ${browser}`;
  }

  private getBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private async getIPAddress(): Promise<string> {
    try {
      // Timeout 2 giây để tránh treo
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      return data.ip || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

export const sessionManager = new SessionManager();
