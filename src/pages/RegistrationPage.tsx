import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, User, Phone, Home } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import sportsIllustration from "@/assets/sports-illustration.png";

// --- MAPPINGS MOVED INSIDE TO PREVENT BUILD ERRORS ---
const boysMapping: Record<string, string[]> = {
  "5": ["100 Meter Race"], "6": ["100 Meter Race"], "7": ["100 Meter Race"],
  "8": ["100 Meter Race", "Slow Cycle", "Chess"], "9": ["100 Meter Race", "Slow Cycle", "Chess"],
  "10": ["100 Meter Race", "Slow Cycle", "Chess", "Badminton"],
  "11": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton"],
  "12": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton"],
  "13": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton", "Kho Kho"],
  "14": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton", "Kho Kho"],
  "15": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton", "Kho Kho"],
  "16": ["100 Meter Race", "Long Jump", "Slow Cycle", "Chess", "Badminton", "Kho Kho"],
  "17": ["Chess", "Badminton", "Kho Kho"], "18-34": ["Chess", "Badminton"],
  "35 & above": ["Long Jump", "Chess", "Badminton", "Marathon", "Volleyball"]
};

const girlsMapping: Record<string, string[]> = {
  "5": ["100 Meter Race"], "6": ["100 Meter Race"], "7": ["100 Meter Race"],
  "8": ["100 Meter Race", "Chess"], "9": ["100 Meter Race", "Chess"],
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

const getGameImage = (url: string | null) => url || "https://images.unsplash.com/photo-1461896756970-17e914046d90?q=80&w=2070";

interface Game { id: string; name: string; description: string | null; image_url: string | null; }

const RegistrationPage = () => {
  const [step, setStep] = useState<"details" | "games">("details");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [tower, setTower] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [contact, setContact] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: games = [] } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase.from("games").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data as Game[];
    },
  });

  const showMaritalStatus = gender === "Female" && (ageGroup === "18-34" || ageGroup === "35 & above");

  const getAllowedGames = () => {
    if (gender === "Female" && maritalStatus === "Married") return girlsMapping["Married"];
    const mapping = gender === "Male" ? boysMapping : girlsMapping;
    return mapping[ageGroup] || [];
  };

  const allowedGameNames = getAllowedGames();
  const availableGames = games.filter(g => allowedGameNames.includes(g.name));

  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) => {
      if (prev.includes(gameId)) return prev.filter((id) => id !== gameId);
      if (prev.length >= 2) { toast.error("You can select maximum 2 games!"); return prev; }
      return [...prev, gameId];
    });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tower || !flatNo || !contact || !ageGroup || !gender) { toast.error("Fill all fields!"); return; }
    setStep("games");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const registrationId = crypto.randomUUID();
      const { error: regError } = await supabase.from("registrations").insert({
        id: registrationId, participant_name: name.trim(), tower, flat_no: flatNo,
        contact_number: contact, class: ageGroup, gender, marital_status: maritalStatus || "Unmarried",
      } as any);
      if (regError) throw regError;
      const gameInserts = selectedGames.map((gameId) => ({ registration_id: registrationId, game_id: gameId }));
      await supabase.from("registration_games").insert(gameInserts);
      setSubmitted(true);
      confetti();
    } catch (err) { toast.error("Error occurred"); } finally { setSubmitting(false); }
  };

  if (submitted) return <div className="min-h-screen flex items-center justify-center text-center"><h1>Registration Success! 🎉</h1></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {step === "details" ? (
        <form onSubmit={handleDetailsSubmit} className="max-w-md mx-auto space-y-4 pt-10">
          <h2 className="text-3xl font-bold text-orange-500">Register</h2>
          <input className="w-full p-2 bg-slate-800 border-b" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full p-2 bg-slate-800 border-b" placeholder="Contact" value={contact} onChange={e => setContact(e.target.value)} required />
          <div className="flex gap-2">
            <input className="w-1/2 p-2 bg-slate-800 border-b" placeholder="Tower" value={tower} onChange={e => setTower(e.target.value)} required />
            <input className="w-1/2 p-2 bg-slate-800 border-b" placeholder="Flat" value={flatNo} onChange={e => setFlatNo(e.target.value)} required />
          </div>
          <select className="w-full p-2 bg-slate-800" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} required>
            <option value="">Select Age</option>
            {["5","6","7","8","9","10","11","12","13","14","15","16","17","18-34","35 & above"].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="w-full p-2 bg-slate-800" value={gender} onChange={e => setGender(e.target.value)} required>
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {showMaritalStatus && (
            <select className="w-full p-2 bg-slate-800" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} required>
              <option value="">Marital Status</option>
              <option value="Unmarried">Unmarried</option>
              <option value="Married">Married</option>
            </select>
          )}
          <button className="w-full bg-orange-600 p-3 rounded-xl font-bold" type="submit">Next</button>
        </form>
      ) : (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl mb-6">Choose Games</h2>
          <div className="grid grid-cols-2 gap-4">
            {availableGames.map(game => (
              <div key={game.id} onClick={() => toggleGame(game.id)} className={`p-4 border rounded ${selectedGames.includes(game.id) ? 'border-orange-500 bg-slate-800' : ''}`}>
                <img src={getGameImage(game.image_url)} className="w-full h-32 object-cover mb-2" />
                <p>{game.name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={submitting} className="mt-8 w-full bg-green-600 p-4 rounded font-bold">Register Now</button>
        </div>
      )}
    </div>
  );
};
export default RegistrationPage;
