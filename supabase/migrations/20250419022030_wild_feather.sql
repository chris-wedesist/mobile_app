/*
  # Badge System Views and Helper Functions

  1. New Views
    - user_badges_summary: Aggregates badge status for each user
    - badge_leaderboard: Ranks users by badge count

  2. Helper Functions
    - get_user_badges: Returns all badges for a user
    - check_badge_eligibility: Checks if a user is eligible for new badges
*/

-- Create view for user badge summary
CREATE OR REPLACE VIEW user_badges_summary AS
SELECT 
  id,
  (
    CASE WHEN badge_founding_protector THEN 1 ELSE 0 END +
    CASE WHEN badge_shield_builder THEN 1 ELSE 0 END +
    CASE WHEN badge_emergency_sentinel THEN 1 ELSE 0 END +
    CASE WHEN badge_evidence_guardian THEN 1 ELSE 0 END +
    CASE WHEN badge_community_defender THEN 1 ELSE 0 END
  ) as total_badges,
  successful_invite_count,
  badge_founding_protector,
  badge_shield_builder,
  badge_emergency_sentinel,
  badge_evidence_guardian,
  badge_community_defender,
  created_at
FROM user_settings;

-- Create view for badge leaderboard
CREATE OR REPLACE VIEW badge_leaderboard AS
SELECT 
  u.id,
  u.email,
  s.total_badges,
  s.successful_invite_count,
  ROW_NUMBER() OVER (ORDER BY s.total_badges DESC, s.successful_invite_count DESC) as rank
FROM auth.users u
JOIN user_badges_summary s ON u.id = s.id
WHERE u.confirmed_at IS NOT NULL;

-- Create function to get user badges
CREATE OR REPLACE FUNCTION get_user_badges(user_id uuid)
RETURNS TABLE (
  badge_name text,
  awarded boolean,
  progress json
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    badge.name,
    badge.awarded,
    badge.progress
  FROM (
    SELECT 
      'Founding Protector' as name,
      us.badge_founding_protector as awarded,
      NULL::json as progress
    FROM user_settings us
    WHERE us.id = user_id
    UNION ALL
    SELECT 
      'Shield Builder',
      us.badge_shield_builder,
      json_build_object(
        'current', us.successful_invite_count,
        'required', 3
      )
    FROM user_settings us
    WHERE us.id = user_id
    UNION ALL
    SELECT 
      'Emergency Sentinel',
      us.badge_emergency_sentinel,
      json_build_object(
        'current', (
          SELECT COUNT(*)::int 
          FROM incidents 
          WHERE user_id = user_id 
          AND status = 'verified'
        ),
        'required', 5
      )
    FROM user_settings us
    WHERE us.id = user_id
    UNION ALL
    SELECT 
      'Evidence Guardian',
      us.badge_evidence_guardian,
      json_build_object(
        'current', (
          SELECT COUNT(*)::int 
          FROM incident_recordings 
          WHERE user_id = user_id 
          AND status = 'public'
        ),
        'required', 10
      )
    FROM user_settings us
    WHERE us.id = user_id
    UNION ALL
    SELECT 
      'Community Defender',
      us.badge_community_defender,
      json_build_object(
        'requirements', json_build_object(
          'shield_builder', us.badge_shield_builder,
          'emergency_sentinel', us.badge_emergency_sentinel,
          'invites', us.successful_invite_count
        )
      )
    FROM user_settings us
    WHERE us.id = user_id
  ) badge;
END;
$$ LANGUAGE plpgsql;