import khoKhoImg from "@/assets/kho-kho.jpg";
import meterRaceImg from "@/assets/100-meter-race.jpg";
import longJumpImg from "@/assets/long-jump.jpg";
import spoonLemonImg from "@/assets/spoon-lemon-race.jpg";
import musicalChairImg from "@/assets/musical-chair.jpg";
import volleyballImg from "@/assets/volleyball.jpg";
import badmintonImg from "@/assets/badminton.jpg";
import chessImg from "@/assets/chess.jpg";
import marathonImg from "@/assets/marathon.jpg";
import slowCycleImg from "@/assets/slow-cycle.jpg";

const imageMap: Record<string, string> = {
  "kho-kho": khoKhoImg,
  "100-meter-race": meterRaceImg,
  "long-jump": longJumpImg,
  "spoon-lemon-race": spoonLemonImg,
  "musical-chair": musicalChairImg,
  "volleyball": volleyballImg,
  "badminton": badmintonImg,
  "chess": chessImg,
  "marathon": marathonImg,
  "slow-cycle": slowCycleImg,
};

export const getGameImage = (imageKey: string | null): string => {
  if (!imageKey) return khoKhoImg;
  if (imageKey.startsWith("http")) return imageKey;
  return imageMap[imageKey] || khoKhoImg;
};

export default imageMap;
