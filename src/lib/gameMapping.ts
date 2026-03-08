// Maps class + gender to allowed game names
type GameMapping = Record<string, string[]>;

const boysMapping: GameMapping = {
  "1st": ["100 Meter Running", "Drawing Competition"],
  "2nd": ["100 Meter Running", "Drawing Competition"],
  "3rd": ["100 Meter Running", "Drawing Competition"],
  "4th": ["100 Meter Running", "Drawing Competition"],
  "5th": ["100 Meter Running", "Long Jump", "Drawing Competition"],
  "6th": ["100 Meter Running", "Long Jump", "Kho Kho"],
  "7th": ["100 Meter Running", "Long Jump", "Kho Kho"],
  "8th": ["100 Meter Running", "Long Jump", "Kho Kho"],
  "9th": ["100 Meter Running", "Long Jump", "Kho Kho"],
  "10th": ["100 Meter Running", "Long Jump", "Kho Kho"],
  "11th": ["100 Meter Running", "Long Jump", "Kho Kho"],
  "12th": ["100 Meter Running", "Long Jump", "Kho Kho"],
  "Senior": ["Long Jump", "Volleyball"],
};

const girlsMapping: GameMapping = {
  "1st": ["100 Meter Running", "Drawing Competition"],
  "2nd": ["100 Meter Running", "Drawing Competition"],
  "3rd": ["100 Meter Running", "Drawing Competition"],
  "4th": ["100 Meter Running", "Drawing Competition"],
  "5th": ["100 Meter Running", "Long Jump", "Drawing Competition"],
  "6th": ["100 Meter Running", "Long Jump", "Lemon Race", "Kho Kho"],
  "7th": ["100 Meter Running", "Long Jump", "Lemon Race", "Kho Kho"],
  "8th": ["100 Meter Running", "Long Jump", "Lemon Race", "Kho Kho"],
  "9th": ["100 Meter Running", "Long Jump", "Lemon Race", "Kho Kho"],
  "10th": ["100 Meter Running", "Long Jump", "Lemon Race", "Kho Kho"],
  "11th": ["Long Jump", "Kho Kho"],
  "12th": ["Long Jump", "Kho Kho"],
  "Senior": ["Musical Chair"],
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

// Get all unique class groups for admin filtering
export const classGroups = [
  "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th", "11th", "12th", "Senior",
];

export const genderOptions = ["Male", "Female"];

// Get all unique game names across all mappings
export const getAllGameNames = (): string[] => {
  const all = new Set<string>();
  Object.values(boysMapping).forEach(games => games.forEach(g => all.add(g)));
  Object.values(girlsMapping).forEach(games => games.forEach(g => all.add(g)));
  return [...all];
};
