// Maps age group + gender + marital status to allowed game names
// IMPORTANT: Names must exactly match the game names in the database

type GameMapping = Record<string, string[]>;

export const boysMapping: GameMapping = {
  "5": ["100 Meter Race"],
  "6": ["100 Meter Race"],
  "7": ["100 Meter Race"],
  "8": ["100 Meter Race", "Slow Cycle", "Chess"],
  "9": ["100 Meter Race", "Slow Cycle", "Chess"],
  "10": ["100 Meter Race", "Slow Cycle", "Chess", "Badminton"],
  "11": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton"],
  "12": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton"],
  "13": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton", "Kho Kho"],
  "14": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton", "Kho Kho"],
  "15": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton", "Kho Kho"],
  "16": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton", "Kho Kho"],
  "17": ["Chess", "Badminton", "Kho Kho"],
  "18-34": ["Chess", "Badminton"],
  "35 & above": ["Long Jump", "Chess", "Badminton", "Marathon", "Volleyball"]
};

export const girlsMapping: GameMapping = {
  "5": ["100 Meter Race"],
  "6": ["100 Meter Race"],
  "7": ["100 Meter Race"],
  "8": ["100 Meter Race", "Chess"],
  "9": ["100 Meter Race", "Chess"],
  "10": ["100 Meter Race", "Chess", "Badminton"],
  "11": ["100 Meter Race", "Long Jump", "Chess", "Spoon with Lemon Race", "Badminton"],
  "12": ["100 Meter Race", "Long Jump", "Chess", "Spoon with Lemon Race", "Badminton"],
  "13": ["100 Meter Race", "Long Jump", "Chess", "Spoon with Lemon Race", "Badminton", "Kho Kho"],
  "14": ["100 Meter Race", "Long Jump", "Chess", "Spoon with Lemon Race", "Badminton", "Kho Kho"],
  "15": ["100 Meter Race", "Long Jump", "Chess", "Spoon with Lemon Race", "Badminton", "Kho Kho"],
  "16": ["100 Meter Race", "Long Jump", "Chess", "Spoon with Lemon Race", "Badminton", "Kho Kho"],
  "17": ["Chess", "Spoon with Lemon Race", "Badminton", "Kho Kho"],
  "18-34": ["Chess", "Spoon with Lemon Race", "Badminton"],
  "35 & above": ["Chess", "Spoon with Lemon Race", "Badminton"],
  "Married": ["Chess", "Spoon with Lemon Race", "Badminton", "Musical Chair"]
};
