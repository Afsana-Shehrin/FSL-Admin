// /app/results-board/lib/fantasyPoints.ts

export type CricketStats = {
  runs: number
  wickets: number
  catches: number
  balls_faced: number
  runs_conceded: number
  maidens: number
  run_outs: number
  stumpings: number
  fours: number
  sixes: number
  yellow_cards: number
  red_cards: number
  overs: number
  economy_rate?: number | null
}

export type FootballStats = {
  goals: number
  assists: number
  clean_sheets: number
  position: string
  tackles: number
  interceptions: number
  saves: number
  minutes_played: number
  blocks: number
  penalty_saves: number
  goals_conceded: number
  yellow_cards: number
  red_cards: number
}

/**
 * Calculate fantasy points for cricket players
 * Based on standard fantasy cricket scoring systems
 */
export function calculateCricketFantasyPoints(stats: CricketStats): number {
  let points = 0

  // --- BATTING POINTS ---
  
  // 1 point per run
  points += stats.runs * 1
  
  // Boundary bonuses
  points += stats.fours * 1  // +1 for each four
  points += stats.sixes * 2  // +2 for each six
  
  // Milestone bonuses
  if (stats.runs >= 100) {
    points += 16  // Century bonus
  } else if (stats.runs >= 50) {
    points += 8   // Half-century bonus
  } else if (stats.runs >= 30) {
    points += 4   // 30-run bonus
  }
  
  // Strike rate bonus/deduction (if faced at least 10 balls)
  if (stats.balls_faced >= 10) {
    const strikeRate = (stats.runs / stats.balls_faced) * 100
    
    if (strikeRate > 170) points += 6
    else if (strikeRate > 150) points += 4
    else if (strikeRate > 130) points += 2
    else if (strikeRate < 50) points -= 6
    else if (strikeRate < 60) points -= 4
    else if (strikeRate < 70) points -= 2
  }

  // --- BOWLING POINTS ---
  
  // 25 points per wicket
  points += stats.wickets * 25
  
  // Wicket milestone bonuses
  if (stats.wickets >= 5) {
    points += 16  // 5-wicket haul bonus
  } else if (stats.wickets >= 4) {
    points += 8   // 4-wicket haul bonus
  }
  
  // Maiden over bonus (12 points per maiden)
  points += stats.maidens * 12
  
  // Economy rate bonus/deduction
  if (stats.runs_conceded > 0 && stats.balls_faced > 0) {
    const overs = stats.balls_faced / 6
    const economy = stats.runs_conceded / overs
    
    if (economy < 5) points += 6
    else if (economy < 6) points += 4
    else if (economy < 7) points += 2
    else if (economy > 11) points -= 6
    else if (economy > 10) points -= 4
    else if (economy > 9) points -= 2
  }
  
  // Alternative: Use provided economy_rate if available
  if (stats.economy_rate && stats.economy_rate > 0) {
    const economy = stats.economy_rate
    
    if (economy < 5) points += 6
    else if (economy < 6) points += 4
    else if (economy < 7) points += 2
    else if (economy > 11) points -= 6
    else if (economy > 10) points -= 4
    else if (economy > 9) points -= 2
  }

  // --- FIELDING POINTS ---
  
  // 8 points per catch
  points += stats.catches * 8
  
  // 12 points per run out
  points += stats.run_outs * 12
  
  // 12 points per stumping
  points += stats.stumpings * 12

  // --- DISCIPLINE POINTS ---
  
  // Deductions for cards
  points -= stats.yellow_cards * 1
  points -= stats.red_cards * 3

  // Ensure points are not negative
  return Math.max(points, 0)
}

/**
 * Calculate fantasy points for football players
 * Based on standard fantasy football scoring systems
 */
export function calculateFootballFantasyPoints(stats: FootballStats): number {
  let points = 0

  // Position-based scoring multipliers
  const positionMultipliers = {
    'Goalkeeper': { goal: 6, assist: 3, clean_sheet: 4 },
    'Defender': { goal: 6, assist: 3, clean_sheet: 4 },
    'Midfielder': { goal: 5, assist: 3, clean_sheet: 1 },
    'Forward': { goal: 4, assist: 3, clean_sheet: 0 },
    'Striker': { goal: 4, assist: 3, clean_sheet: 0 },
    'Winger': { goal: 4, assist: 3, clean_sheet: 0 },
    'Center Back': { goal: 6, assist: 3, clean_sheet: 4 },
    'Full Back': { goal: 6, assist: 3, clean_sheet: 4 },
    'Defensive Midfielder': { goal: 5, assist: 3, clean_sheet: 1 },
    'Attacking Midfielder': { goal: 5, assist: 3, clean_sheet: 1 }
  }

  // Get multiplier based on position, default to Forward if not found
  const positionKey = stats.position as keyof typeof positionMultipliers
  const multiplier = positionMultipliers[positionKey] || positionMultipliers['Forward']

  // --- ATTACKING POINTS ---
  
  // Goals with position-based points
  points += stats.goals * multiplier.goal
  
  // Assists
  points += stats.assists * multiplier.assist

  // --- DEFENSIVE POINTS ---
  
  // Clean sheet bonus (position-based)
  if (stats.clean_sheets > 0) {
    points += multiplier.clean_sheet
  }
  
  // Tackles (1 point per tackle)
  points += stats.tackles * 1
  
  // Interceptions (1 point per interception)
  points += stats.interceptions * 1
  
  // Blocks (1 point per block)
  points += stats.blocks * 1

  // --- GOALKEEPER SPECIFIC ---
  
  if (stats.position === 'Goalkeeper') {
    // 1 point per 3 saves
    points += Math.floor(stats.saves / 3)
    
    // Penalty save bonus (5 points)
    points += stats.penalty_saves * 5
    
    // Goals conceded deduction
    if (stats.goals_conceded >= 4) points -= 3
    else if (stats.goals_conceded >= 3) points -= 2
    else if (stats.goals_conceded >= 2) points -= 1
  }

  // --- PLAYING TIME POINTS ---
  
  if (stats.minutes_played >= 60) {
    points += 2  // Played 60+ minutes
  } else if (stats.minutes_played > 0) {
    points += 1  // Played any minutes
  }

  // --- DISCIPLINE POINTS ---
  
  // Card deductions
  points -= stats.yellow_cards * 1
  points -= stats.red_cards * 3

  // Ensure points are not negative
  return Math.max(points, 0)
}

/**
 * Simplified cricket points calculation (basic version)
 * For when you don't have all the detailed stats
 */
export function calculateCricketPointsBasic(stats: {
  runs: number
  wickets: number
  catches: number
  balls_faced: number
  yellow_cards: number
  red_cards: number
}): number {
  let points = 0
  
  // Basic calculation
  points += stats.runs * 1
  points += stats.wickets * 25
  points += stats.catches * 8
  
  // Discipline
  points -= stats.yellow_cards * 1
  points -= stats.red_cards * 3
  
  return Math.max(points, 0)
}

/**
 * Simplified football points calculation (basic version)
 * For when you don't have all the detailed stats
 */
export function calculateFootballPointsBasic(stats: {
  goals: number
  assists: number
  clean_sheets: number
  position: string
  yellow_cards: number
  red_cards: number
}): number {
  let points = 0
  
  // Position multipliers
  const isGoalkeeperOrDefender = ['Goalkeeper', 'Defender', 'Center Back', 'Full Back'].includes(stats.position)
  const isMidfielder = ['Midfielder', 'Defensive Midfielder', 'Attacking Midfielder', 'Winger'].includes(stats.position)
  
  // Goals
  if (isGoalkeeperOrDefender) {
    points += stats.goals * 6
  } else if (isMidfielder) {
    points += stats.goals * 5
  } else {
    points += stats.goals * 4
  }
  
  // Assists
  points += stats.assists * 3
  
  // Clean sheets
  if (isGoalkeeperOrDefender) {
    points += stats.clean_sheets * 4
  } else if (isMidfielder) {
    points += stats.clean_sheets * 1
  }
  
  // Discipline
  points -= stats.yellow_cards * 1
  points -= stats.red_cards * 3
  
  return Math.max(points, 0)
}

/**
 * Main function to calculate points based on sport
 */
export function calculateFantasyPoints(
  sport: 'cricket' | 'football' | string,
  stats: CricketStats | FootballStats
): number {
  if (sport.toLowerCase() === 'cricket') {
    return calculateCricketFantasyPoints(stats as CricketStats)
  } else if (sport.toLowerCase() === 'football') {
    return calculateFootballFantasyPoints(stats as FootballStats)
  } else {
    // Default to football for other sports
    return calculateFootballPointsBasic({
      goals: (stats as any).goals || 0,
      assists: (stats as any).assists || 0,
      clean_sheets: (stats as any).clean_sheets || 0,
      position: (stats as any).position || 'Forward',
      yellow_cards: (stats as any).yellow_cards || 0,
      red_cards: (stats as any).red_cards || 0
    })
  }
}

/**
 * Helper to convert database player stats to cricket stats
 */
export function convertToCricketStats(playerStat: any): CricketStats {
  return {
    runs: playerStat.runs || 0,
    wickets: playerStat.wickets || 0,
    catches: playerStat.catches || 0,
    balls_faced: playerStat.balls_faced || 0,
    runs_conceded: playerStat.runs_conceded || 0,
    maidens: playerStat.maidens || 0,
    run_outs: playerStat.run_outs || 0,
    stumpings: playerStat.stumpings || 0,
    fours: playerStat.fours || 0,
    sixes: playerStat.sixes || 0,
    yellow_cards: playerStat.yellow_cards || 0,
    red_cards: playerStat.red_cards || 0,
    overs: playerStat.overs || null
  }
}

/**
 * Helper to convert database player stats to football stats
 */
export function convertToFootballStats(playerStat: any): FootballStats {
  return {
    goals: playerStat.goals || 0,
    assists: playerStat.assists || 0,
    clean_sheets: playerStat.clean_sheets || 0,
    position: playerStat.position || 'Forward',
    tackles: playerStat.tackles || 0,
    interceptions: playerStat.interceptions || 0,
    saves: playerStat.saves || 0,
    minutes_played: playerStat.minutes_played || 0,
    blocks: playerStat.blocks || 0,
    penalty_saves: playerStat.penalty_saves || 0,
    goals_conceded: playerStat.goals_conceded || 0,
    yellow_cards: playerStat.yellow_cards || 0,
    red_cards: playerStat.red_cards || 0
  }
}