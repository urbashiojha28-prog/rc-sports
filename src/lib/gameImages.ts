import cricketImg from "@/assets/cricket.jpg";
import badmintonImg from "@/assets/badminton.jpg";
import chessImg from "@/assets/chess.jpg";
import carromImg from "@/assets/carrom.jpg";
import tableTennisImg from "@/assets/table-tennis.jpg";
import tugOfWarImg from "@/assets/tug-of-war.jpg";

const imageMap: Record<string, string> = {
  cricket: cricketImg,
  badminton: badmintonImg,
  chess: chessImg,
  carrom: carromImg,
  "table-tennis": tableTennisImg,
  "tug-of-war": tugOfWarImg,
};

export const getGameImage = (imageKey: string | null): string => {
  if (!imageKey) return cricketImg;
  return imageMap[imageKey] || cricketImg;
};

export default imageMap;
