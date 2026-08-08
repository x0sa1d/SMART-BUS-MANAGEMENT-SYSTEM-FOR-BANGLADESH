/** Heuristic AI seat recommendation for FYP. No external API required. */

export type SeatCandidate = {
  id: string;
  seatNumber: string;
  seatType: string;
  row: number;
  column: number;
  isAvailable: boolean;
};

export type SeatPreference = "window" | "aisle" | "front" | "back" | "any";

export type SeatRecommendation = {
  seatId: string;
  seatNumber: string;
  score: number;
  reasons: string[];
};

function isWindowSeat(column: number, maxColumn: number): boolean {
  return column === 1 || column === maxColumn;
}

function isAisleSeat(column: number, maxColumn: number): boolean {
  if (maxColumn <= 2) return false;
  const mid = Math.ceil(maxColumn / 2);
  return column === mid || column === mid + 1;
}

/**
 * Scores available seats using preference, seat class, and layout heuristics.
 */
export function recommendSeats(
  seats: SeatCandidate[],
  preference: SeatPreference = "any",
  count = 1
): SeatRecommendation[] {
  const available = seats.filter((s) => s.isAvailable);
  if (available.length === 0) return [];

  const maxRow = Math.max(...seats.map((s) => s.row), 1);
  const maxColumn = Math.max(...seats.map((s) => s.column), 1);

  const scored = available.map((seat) => {
    let score = 50;
    const reasons: string[] = [];

    if (seat.seatType === "VIP") {
      score += 25;
      reasons.push("VIP comfort");
    } else if (seat.seatType === "PREMIUM") {
      score += 15;
      reasons.push("Premium class");
    }

    const window = isWindowSeat(seat.column, maxColumn);
    const aisle = isAisleSeat(seat.column, maxColumn);

    if (preference === "window" && window) {
      score += 30;
      reasons.push("Window view");
    } else if (preference === "aisle" && aisle) {
      score += 28;
      reasons.push("Easy aisle access");
    } else if (preference === "front" && seat.row <= Math.ceil(maxRow * 0.3)) {
      score += 26;
      reasons.push("Near front / faster exit");
    } else if (preference === "back" && seat.row >= Math.ceil(maxRow * 0.7)) {
      score += 22;
      reasons.push("Quieter rear section");
    } else if (preference === "any") {
      if (window) {
        score += 12;
        reasons.push("Window seat");
      }
      if (seat.row <= Math.ceil(maxRow * 0.4)) {
        score += 8;
        reasons.push("Convenient row");
      }
    }

    // Prefer seats with neighbors free (less crowded feel)
    const neighbors = available.filter(
      (s) => s.id !== seat.id && s.row === seat.row && Math.abs(s.column - seat.column) === 1
    );
    if (neighbors.length > 0) {
      score += 6;
      reasons.push("Space beside you");
    }

    // Slight preference for mid-bus (smoother ride)
    const midRow = maxRow / 2;
    const distFromMid = Math.abs(seat.row - midRow);
    if (distFromMid <= maxRow * 0.2) {
      score += 5;
      reasons.push("Smoother mid-bus ride");
    }

    if (reasons.length === 0) reasons.push("Good available option");

    return {
      seatId: seat.id,
      seatNumber: seat.seatNumber,
      score,
      reasons: reasons.slice(0, 3),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(1, count));
}

/** Pick best contiguous block of `count` seats in the same row when possible. */
export function recommendSeatBlock(
  seats: SeatCandidate[],
  count: number,
  preference: SeatPreference = "any"
): SeatRecommendation[] {
  if (count <= 1) return recommendSeats(seats, preference, 1);

  const available = seats.filter((s) => s.isAvailable);
  const byRow = new Map<number, SeatCandidate[]>();
  for (const s of available) {
    const list = byRow.get(s.row) ?? [];
    list.push(s);
    byRow.set(s.row, list);
  }

  let bestBlock: SeatCandidate[] = [];
  let bestScore = -1;

  for (const [, rowSeats] of byRow) {
    const sorted = [...rowSeats].sort((a, b) => a.column - b.column);
    for (let i = 0; i <= sorted.length - count; i++) {
      const block = sorted.slice(i, i + count);
      const contiguous = block.every(
        (s, idx) => idx === 0 || s.column === block[idx - 1].column + 1
      );
      if (!contiguous) continue;
      const score = recommendSeats(block, preference, count).reduce((sum, r) => sum + r.score, 0);
      if (score > bestScore) {
        bestScore = score;
        bestBlock = block;
      }
    }
  }

  if (bestBlock.length === count) {
    return recommendSeats(bestBlock, preference, count);
  }

  return recommendSeats(seats, preference, count);
}
