// src/utils/dice.ts

// Roll a single D6 with explosion on 6; can explode infinitely
export function rollExplodingD6Once(): number {
  let total = 0;
  let roll = Math.floor(Math.random() * 6) + 1;
  total += roll;
  while (roll === 6) {
    roll = Math.floor(Math.random() * 6) + 1;
    total += roll;
  }
  return total;
}

// Roll N exploding D6 dice and return their sum
export function rollExplodingD6Sum(times: number): number {
  let sum = 0;
  for (let i = 0; i < Math.max(0, times); i++) {
    sum += rollExplodingD6Once();
  }
  return sum;
}
