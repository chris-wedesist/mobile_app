import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

class TrustMetricsManager {
  private static instance: TrustMetricsManager;
  
  private constructor() {}

  public static getInstance(): TrustMetricsManager {
    if (!TrustMetricsManager.instance) {
      TrustMetricsManager.instance = new TrustMetricsManager();
    }
    return TrustMetricsManager.instance;
  }

  async handleSafeEncounterVerified(encounterId: string) {
    try {
      // Get the encounter details
      const { data: encounter, error: encounterError } = await supabase
        .from('safe_encounters')
        .select('*')
        .eq('id', encounterId)
        .single();

      if (encounterError) throw encounterError;

      // Get current metrics first
      const { data: currentMetrics, error: currentMetricsError } = await supabase
        .from('trust_metrics')
        .select('total_verified')
        .eq('id', encounter.user_id)
        .single();

      if (currentMetricsError) throw currentMetricsError;

      // Update trust metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('trust_metrics')
        .update({
          total_verified: (currentMetrics?.total_verified || 0) + 1,
          // Trust score is automatically calculated by the database trigger
        })
        .eq('id', encounter.user_id)
        .select()
        .single();

      if (metricsError) throw metricsError;

      // Log the verification event
      await supabase.from('trust_events').insert({
        encounter_id: encounterId,
        event_type: 'verification',
        previous_score: metrics.trust_score,
        new_score: metrics.trust_score,
        details: {
          encounter_type: encounter.encounter_type,
          verification_method: 'community',
          timestamp: new Date().toISOString()
        }
      });

      return metrics;
    } catch (error) {
      console.error('Error updating trust metrics:', error);
      throw error;
    }
  }

  async getTrustMetricsSummary() {
    try {
      const { data, error } = await supabase
        .rpc('get_trust_metrics_summary');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting trust metrics summary:', error);
      throw error;
    }
  }

  async getUserTrustScore(userId: string) {
    try {
      const { data, error } = await supabase
        .from('trust_metrics')
        .select('trust_score, total_encounters, total_verified, total_flagged')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user trust score:', error);
      throw error;
    }
  }

  async flagEncounter(encounterId: string, reason: string) {
    try {
      // Get the encounter details
      const { data: encounter, error: encounterError } = await supabase
        .from('safe_encounters')
        .select('*')
        .eq('id', encounterId)
        .single();

      if (encounterError) throw encounterError;

      // Get current metrics first
      const { data: currentMetrics, error: currentMetricsError } = await supabase
        .from('trust_metrics')
        .select('total_flagged')
        .eq('id', encounter.user_id)
        .single();

      if (currentMetricsError) throw currentMetricsError;

      // Update trust metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('trust_metrics')
        .update({
          total_flagged: (currentMetrics?.total_flagged || 0) + 1,
          // Trust score is automatically calculated by the database trigger
        })
        .eq('id', encounter.user_id)
        .select()
        .single();

      if (metricsError) throw metricsError;

      // Log the flag event
      await supabase.from('trust_events').insert({
        encounter_id: encounterId,
        event_type: 'flag',
        previous_score: metrics.trust_score,
        new_score: metrics.trust_score,
        details: {
          reason,
          encounter_type: encounter.encounter_type,
          timestamp: new Date().toISOString()
        }
      });

      return metrics;
    } catch (error) {
      console.error('Error flagging encounter:', error);
      throw error;
    }
  }
}

export default TrustMetricsManager;