// src/lib/gameMapping.ts

export type GameMapping = Record<string, string[]>;

/**
 * MALE MAPPING
 */
export const boysMapping: GameMapping = {
  "5": ["100 Meter Race"],
  "6": ["100 Meter Race"],
  "7": ["100 Meter Race"],
  "8": ["100 Meter Race", "Slow Cycle Racing", "Chess"],
  "9": ["100 Meter Race", "Slow Cycle Racing", "Chess"],
  "10": ["100 Meter Race", "Slow Cycle Racing", "Chess", "Badminton"],
  "11": ["100 Meter Race", "Long Jump", "Slow Cycle Racing", "Chess", "Badminton"],
  "12": ["100 Meter Race", "Long Jump", "Slow Cycle Racing", "Chess", "Badminton"],
  "13": ["100 Meter Race", "Long Jump", "Slow Cycle Racing", "Chess", "Badminton", "Kho-Kho"],
  "14": ["100 Meter Race", "Long Jump", "Slow Cycle Racing", "Chess", "Badminton", "Kho-Kho"],
  "15": ["100 Meter Race", "Long Jump", "Slow Cycle Racing", "Chess", "Badminton", "Kho-Kho"],
  "16": ["100 Meter Race", "Long Jump", "Slow Cycle Racing", "Chess", "Badminton", "Kho-Kho"],
  "17": ["Chess", "Badminton", "Kho-Kho"],
  "18-34": ["Chess", "Badminton"],
  "35 & above": ["Long Jump", "Chess", "Badminton", "Marathon", "Volleyball"]
};

/**
 * FEMALE MAPPING
 */
export const girlsMapping: GameMapping = {
  "5": ["100 Meter Race"],
  "6": ["100 Meter Race"],
  "7": ["100 Meter Race"],
  "8": ["100 Meter Race", "Chess"],
  "9": ["100 Meter Race", "Chess"],
  "10": ["100 Meter Race", "Chess", "Badminton"],
  "11": ["100 Meter Race", "Long Jump", "Chess", "Spoon Race", "Badminton"],
  "12": ["100 Meter Race", "Long Jump", "Chess", "Spoon Race", "Badminton"],
  "13": ["100 Meter Race", "Long Jump", "Chess", "Spoon Race", "Badminton", "Kho-Kho"],
  "14": ["100 Meter Race", "Long Jump", "Chess", "Spoon Race", "Badminton", "Kho-Kho"],
  "15": ["100 Meter Race", "Long Jump", "Chess", "Spoon Race", "Badminton", "Kho-Kho"],
  "16": ["100 Meter Race", "Long Jump", "Chess", "Spoon Race", "Badminton", "Kho-Kho"],
  "17": ["Chess", "Spoon Race", "Badminton", "Kho-Kho"],
  "18 & Above": ["Chess", "Spoon Race", "Badminton"],
  "Married": ["Chess", "Spoon Race", "Badminton", "Musical Chairs"]
};
