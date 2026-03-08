import khoKhoImg from "@/assets/kho-kho.jpg";
import meterRaceImg from "@/assets/100-meter-race.jpg";
import longJumpImg from "@/assets/long-jump.jpg";
import spoonLemonImg from "@/assets/spoon-lemon-race.jpg";
import musicalChairImg from "@/assets/musical-chair.jpg";
import drawingImg from "@/assets/drawing-competition.jpg";

const imageMap: Record<string, string> = {
  "kho-kho": khoKhoImg,
  "100-meter-race": meterRaceImg,
  "long-jump": longJumpImg,
  "spoon-lemon-race": spoonLemonImg,
  "musical-chair": musicalChairImg,
  "drawing-competition": drawingImg,
};

export const getGameImage = (imageKey: string | null): string => {
  if (!imageKey) return khoKhoImg;
  if (imageKey.startsWith("http")) return imageKey;
  return imageMap[imageKey] || khoKhoImg;
};

export default imageMap;
