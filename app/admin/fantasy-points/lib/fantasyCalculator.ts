import { PlayerStats, ScoringRule, PointsBreakdown } from './types';

export class FantasyCalculator {
  private rules: ScoringRule[];

  constructor(rules: ScoringRule[]) {
    this.rules = rules;
  }

  // Get specific rule value with fallback
  private getRuleValue(key: keyof ScoringRule, defaultValue: number = 0): number {
    const rule = this.rules.find(r => r.action_type === key);
    return rule ? Number(rule[key]) || defaultValue : defaultValue;
  }

  // Calculate batting points
  calculateBattingPoints(stats: PlayerStats): number {
    let points = 0;
    
    // Points per run
    const runsPoints = stats.runs * this.getRuleValue('points_per_run', 1);
    points += runsPoints;
    
    // Boundary bonuses
    const fourPoints = stats.fours * this.getRuleValue('points_per_four', 1);
    const sixPoints = stats.sixes * this.getRuleValue('points_per_six', 2);
    points += fourPoints + sixPoints;
    
    // Milestone bonuses
    if (stats.runs >= 100) {
      points += this.getRuleValue('century_bonus', 25);
    } else if (stats.runs >= 75) {
      points += this.getRuleValue('seventyfive_bonus', 12);
    } else if (stats.runs >= 50) {
      points += this.getRuleValue('half_century_bonus', 10);
    } else if (stats.runs >= 30) {
      points += this.getRuleValue('thirty_bonus', 4);
    }
    
    // Duck penalty
    if (stats.duck && stats.runs === 0) {
      points += this.getRuleValue('duck_points', -5);
    }
    
    // Strike rate bonus/penalty
    if (stats.balls_faced >= this.getRuleValue('min_balls_for_strike_rate', 10)) {
      const sr = stats.strike_rate;
      const srBonusThreshold = this.getRuleValue('strike_rate_bonus_threshold', 70);
      const srBonusPoints = this.getRuleValue('strike_rate_bonus_points', 6);
      const srPenaltyThreshold = this.getRuleValue('strike_rate_penalty_threshold', 50);
      const srPenaltyPoints = this.getRuleValue('strike_rate_penalty_points', -6);
      
      if (sr > srBonusThreshold) {
        points += srBonusPoints;
      } else if (sr < srPenaltyThreshold) {
        points += srPenaltyPoints;
      }
    }
    
    return points;
  }

  // Calculate bowling points
  calculateBowlingPoints(stats: PlayerStats): number {
    let points = 0;
    
    // Points per wicket
    const wicketPoints = stats.wickets * this.getRuleValue('points_per_wicket', 25);
    points += wicketPoints;
    
    // Wicket type bonus (bowled/lbw)
    const bowledLbwBonus = stats.bowled_lbw_wickets * this.getRuleValue('bowled_bonus', 8);
    points += bowledLbwBonus;
    
    // Maiden overs
    const maidenPoints = stats.maidens * 5; // Assuming 5 points per maiden
    points += maidenPoints;
    
    // Wicket milestones
    if (stats.wickets >= 5) {
      points += this.getRuleValue('five_wicket_bonus', 25);
    } else if (stats.wickets >= 4) {
      points += this.getRuleValue('four_wicket_bonus', 10);
    } else if (stats.wickets >= 3) {
      points += 4; // 3-wicket bonus
    }
    
    // Economy rate bonus/penalty
    if (stats.overs >= this.getRuleValue('min_overs_for_economy', 2)) {
      const economy = stats.economy_rate;
      const econBonusThreshold = this.getRuleValue('economy_rate_bonus_threshold', 5);
      const econBonusPoints = this.getRuleValue('economy_rate_bonus_points', 6);
      const econPenaltyThreshold = this.getRuleValue('economy_rate_penalty_threshold', 9);
      const econPenaltyPoints = this.getRuleValue('economy_rate_penalty_points', -6);
      
      if (economy < econBonusThreshold) {
        points += econBonusPoints;
      } else if (economy > econPenaltyThreshold) {
        points += econPenaltyPoints;
      }
    }
    
    return points;
  }

  // Calculate fielding points
  calculateFieldingPoints(stats: PlayerStats): number {
    let points = 0;
    
    // Catches
    const catchPoints = stats.catches * this.getRuleValue('catch_points', 10);
    points += catchPoints;
    
    // Stumpings (for wicket-keepers)
    const stumpPoints = stats.stumpings * this.getRuleValue('stump_points', 15);
    points += stumpPoints;
    
    // Run outs
    const runoutPoints = (stats.run_outs + stats.assisted_run_outs) * this.getRuleValue('run_out_points', 15);
    points += runoutPoints;
    
    return points;
  }

  // Calculate all points with breakdown
  calculatePoints(stats: PlayerStats): { total: number; breakdown: PointsBreakdown } {
    const battingPoints = this.calculateBattingPoints(stats);
    const bowlingPoints = this.calculateBowlingPoints(stats);
    const fieldingPoints = this.calculateFieldingPoints(stats);
    
    let total = battingPoints + bowlingPoints + fieldingPoints;
    
    // Captain/Vice-captain multipliers
    let captainBonus = 0;
    let viceCaptainBonus = 0;
    
    if (stats.is_captain) {
      const multiplier = this.getRuleValue('captain_multiplier', 1.5);
      captainBonus = total * (multiplier - 1);
      total *= multiplier;
    } else if (stats.is_vice_captain) {
      const multiplier = this.getRuleValue('vice_captain_multiplier', 1.25);
      viceCaptainBonus = total * (multiplier - 1);
      total *= multiplier;
    }
    
    // Player of the match bonus
    let playerOfMatch = 0;
    if (stats.player_of_match) {
      playerOfMatch = this.getRuleValue('player_of_match_points', 50);
      total += playerOfMatch;
    }
    
    const breakdown: PointsBreakdown = {
      batting: {
        runs: battingPoints,
        boundaries: stats.fours * this.getRuleValue('points_per_four', 1) + 
                   stats.sixes * this.getRuleValue('points_per_six', 2),
        milestone: this.getMilestoneBonus(stats.runs),
        duck: stats.duck && stats.runs === 0 ? this.getRuleValue('duck_points', -5) : 0,
        strikeRate: this.getStrikeRatePoints(stats)
      },
      bowling: {
        wickets: stats.wickets * this.getRuleValue('points_per_wicket', 25),
        wicketType: stats.bowled_lbw_wickets * this.getRuleValue('bowled_bonus', 8),
        maiden: stats.maidens * 5,
        economy: this.getEconomyPoints(stats),
        wicketMilestone: this.getWicketMilestoneBonus(stats.wickets)
      },
      fielding: {
        catches: stats.catches * this.getRuleValue('catch_points', 10),
        stumpings: stats.stumpings * this.getRuleValue('stump_points', 15),
        runouts: (stats.run_outs + stats.assisted_run_outs) * this.getRuleValue('run_out_points', 15)
      },
      captainBonus,
      viceCaptainBonus,
      playerOfMatch,
      total
    };
    
    return { total, breakdown };
  }

  // Helper methods for breakdown
  private getMilestoneBonus(runs: number): number {
    if (runs >= 100) return this.getRuleValue('century_bonus', 25);
    if (runs >= 75) return this.getRuleValue('seventyfive_bonus', 12);
    if (runs >= 50) return this.getRuleValue('half_century_bonus', 10);
    if (runs >= 30) return this.getRuleValue('thirty_bonus', 4);
    return 0;
  }

  private getStrikeRatePoints(stats: PlayerStats): number {
    if (stats.balls_faced < this.getRuleValue('min_balls_for_strike_rate', 10)) return 0;
    
    const sr = stats.strike_rate;
    if (sr > this.getRuleValue('strike_rate_bonus_threshold', 70)) {
      return this.getRuleValue('strike_rate_bonus_points', 6);
    } else if (sr < this.getRuleValue('strike_rate_penalty_threshold', 50)) {
      return this.getRuleValue('strike_rate_penalty_points', -6);
    }
    return 0;
  }

  private getEconomyPoints(stats: PlayerStats): number {
    if (stats.overs < this.getRuleValue('min_overs_for_economy', 2)) return 0;
    
    const economy = stats.economy_rate;
    if (economy < this.getRuleValue('economy_rate_bonus_threshold', 5)) {
      return this.getRuleValue('economy_rate_bonus_points', 6);
    } else if (economy > this.getRuleValue('economy_rate_penalty_threshold', 9)) {
      return this.getRuleValue('economy_rate_penalty_points', -6);
    }
    return 0;
  }

  private getWicketMilestoneBonus(wickets: number): number {
    if (wickets >= 5) return this.getRuleValue('five_wicket_bonus', 25);
    if (wickets >= 4) return this.getRuleValue('four_wicket_bonus', 10);
    if (wickets >= 3) return 4;
    return 0;
  }
}