// Maps class + gender to allowed game names
// IMPORTANT: Names must exactly match the game names in the database
type GameMapping = Record<string, string[]>;

const boysMapping: GameMapping = {
  "1st": ["100 Meter Race", "Drawing Competition"],
  "2nd": ["100 Meter Race", "Drawing Competition"],
  "3rd": ["100 Meter Race", "Drawing Competition"],
  "4th": ["100 Meter Race", "Drawing Competition"],
  "5th": ["100 Meter Race", "Long Jump", "Drawing Competition"],
  "6th": ["100 Meter Race", "Long Jump", "Kho Kho(class 5-12 only)"],
  "7th": ["100 Meter Race", "Long Jump", "Kho Kho(class 5-12 only)"],
  "8th": ["100 Meter Race", "Long Jump", "Kho Kho(class 5-12 only)"],
  "9th": ["100 Meter Race", "Long Jump", "Kho Kho(class 5-12 only)"],
  "10th": ["100 Meter Race", "Long Jump", "Kho Kho(class 5-12 only)"],
  "11th": ["Long Jump", "Kho Kho(class 5-12 only)"],
  "12th": ["Long Jump", "Kho Kho(class 5-12 only)"],
  "Senior": ["Long Jump", "Volleyball"],
};

const girlsMapping: GameMapping = {
  "1st": ["100 Meter Race", "Drawing Competition"],
  "2nd": ["100 Meter Race", "Drawing Competition"],
  "3rd": ["100 Meter Race", "Drawing Competition"],
  "4th": ["100 Meter Race", "Drawing Competition"],
  "5th": ["100 Meter Race", "Long Jump", "Drawing Competition"],
  "6th": ["100 Meter Race", "Long Jump", "Spoon with Lemon Race", "Kho Kho(class 5-12 only)"],
  "7th": ["100 Meter Race", "Long Jump", "Spoon with Lemon Race", "Kho Kho(class 5-12 only)"],
  "8th": ["100 Meter Race", "Long Jump", "Spoon with Lemon Race", "Kho Kho(class 5-12 only)"],
  "9th": ["100 Meter Race", "Long Jump", "Spoon with Lemon Race", "Kho Kho(class 5-12 only)"],
  "10th": ["100 Meter Race", "Long Jump", "Spoon with Lemon Race", "Kho Kho(class 5-12 only)"],
  "11th": ["Long Jump", "Kho Kho(class 5-12 only)"],
  "12th": ["Long Jump", "Kho Kho(class 5-12 only)"],
  "Senior": ["Musical Chair (Only Married Ladies)"],
};

export const getAvailableGameNames = (studentClass: string, gender: string): string[] => {
  if (!studentClass || !gender) return [];
  if (gender === "Male") return boysMapping[studentClass] || [];
  if (gender === "Female") return girlsMapping[studentClass] || [];
  // For "Other", show union of both
  const boys = boysMapping[studentClass] || [];
  const girls = girlsMapping[studentClass] || [];
  return [...new Set([...boys, ...girls])];
};

export const classGroups = [
  "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th", "11th", "12th", "Senior",
];

export const genderOptions = ["Male", "Female"];

export const getAllGameNames = (): string[] => {
  const all = new Set<string>();
  Object.values(boysMapping).forEach(games => games.forEach(g => all.add(g)));
  Object.values(girlsMapping).forEach(games => games.forEach(g => all.add(g)));
  return [...all];
};
