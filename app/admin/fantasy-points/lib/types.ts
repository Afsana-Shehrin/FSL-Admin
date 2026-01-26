export interface PlayerStats {
  stat_id: number;
  player_id: number;
  player_name: string;
  team_id: number;
  team_name?: string;
  position: string;
  runs: number;
  balls_faced: number;
  wickets: number;
  maidens: number;
  fours: number;
  sixes: number;
  runs_conceded: number;
  overs: number;
  economy_rate: number;
  strike_rate: number;
  catches: number;
  stumpings: number;
  run_outs: number;
  assisted_run_outs: number;
  duck: boolean;
  bowled_lbw_wickets: number;
  fantasy_points: number;
  is_captain?: boolean;
  is_vice_captain?: boolean;
  player_of_match?: boolean;
  updated_at?: string;
}

export interface ScoringRule {
  id: string;
  name: string;
  category: string;
  action_type: string;
  points: number;
  min_value?: number;
  max_value?: number;
  points_per_run?: number;
  points_per_wicket?: number;
  points_per_four?: number;
  points_per_six?: number;
  thirty_bonus?: number;
  seventyfive_bonus?: number;
  century_bonus?: number;
  half_century_bonus?: number;
  five_wicket_bonus?: number;
  four_wicket_bonus?: number;
  duck_points?: number;
  bowled_bonus?: number;
  lbw_bonus?: number;
  catch_points?: number;
  stump_points?: number;
  run_out_points?: number;
  min_overs_for_economy?: number;
  min_balls_for_strike_rate?: number;
  economy_rate_bonus_threshold?: number;
  economy_rate_bonus_points?: number;
  economy_rate_penalty_threshold?: number;
  economy_rate_penalty_points?: number;
  strike_rate_bonus_threshold?: number;
  strike_rate_bonus_points?: number;
  strike_rate_penalty_threshold?: number;
  strike_rate_penalty_points?: number;
  captain_multiplier?: number;
  vice_captain_multiplier?: number;
  player_of_match_points?: number;
}

export interface PointsBreakdown {
  batting: {
    runs: number;
    boundaries: number;
    milestone: number;
    duck: number;
    strikeRate: number;
  };
  bowling: {
    wickets: number;
    wicketType: number;
    maiden: number;
    economy: number;
    wicketMilestone: number;
  };
  fielding: {
    catches: number;
    stumpings: number;
    runouts: number;
  };
  captainBonus: number;
  viceCaptainBonus: number;
  playerOfMatch: number;
  total: number;
}

export interface TeamPoints {
  team_id: number;
  team_name: string;
  team_logo?: string;
  total_points: number;
  players: PlayerStats[];
}

export interface MatchResult {
  result_id: number;
  match_id: number;
  match_name: string;
  sport_id: number;
  status: string;
  home_team_id: number;
  away_team_id: number;
  home_team_name?: string;
  away_team_name?: string;
  match_date: string;
}