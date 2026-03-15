// Maps age group + gender + marital status to allowed game names
// IMPORTANT: Names must exactly match the game names in the database

type GameMapping = Record<string, string[]>;

const boysMapping: GameMapping = {
  "5-17": ["100 Meter Race", "Long Jump", "Kho Kho", "Badminton", "Chess"],
  "18-34": ["100 Meter Race", "Long Jump", "Kho Kho", "Volleyball", "Badminton", "Chess", "Marathon", "Slow Cycle"],
  "35+": ["Long Jump", "Volleyball", "Badminton", "Chess", "Marathon", "Slow Cycle"],
};

const girlsMapping: GameMapping = {
  "5-17": ["100 Meter Race", "Long Jump", "Kho Kho", "Spoon with Lemon Race", "Badminton", "Chess"],
  "18-34": ["100 Meter Race", "Long Jump", "Kho Kho", "Spoon with Lemon Race", "Badminton", "Chess", "Marathon", "Slow Cycle"],
  "35+": ["Spoon with Lemon Race", "Badminton", "Chess"],
};

// Senior married females get Musical Chair in addition
const seniorMarriedFemaleExtra = ["Musical Chair (Only Married Ladies)"];

export const getAvailableGameNames = (
  ageGroup: string,
  gender: string,
  maritalStatus?: string
): string[] => {
  if (!ageGroup || !gender) return [];

  if (gender === "Male") return boysMapping[ageGroup] || [];

  if (gender === "Female") {
    const base = girlsMapping[ageGroup] || [];
    // Senior married females also get Musical Chair
    if (ageGroup === "35+" && maritalStatus === "Married") {
      return [...base, ...seniorMarriedFemaleExtra];
    }
    return base;
  }

  // For "Other", show union of both
  const boys = boysMapping[ageGroup] || [];
  const girls = girlsMapping[ageGroup] || [];
  return [...new Set([...boys, ...girls])];
};

export const ageGroups = ["5-17", "18-34", "35+"];

export const genderOptions = ["Male", "Female"];

export const getAllGameNames = (): string[] => {
  const all = new Set<string>();
  Object.values(boysMapping).forEach(games => games.forEach(g => all.add(g)));
  Object.values(girlsMapping).forEach(games => games.forEach(g => all.add(g)));
  seniorMarriedFemaleExtra.forEach(g => all.add(g));
  return [...all];
};
