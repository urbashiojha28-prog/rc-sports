import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { boysMapping, girlsMapping } from "@/lib/gameMapping";
import { CheckCircle2, Trophy } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// --- THE BULLETPROOF IMAGE MAP ---
// This ensures every game has a high-quality photo regardless of database settings
const getGameImage = (gameName: string) => {
  const images: Record<string, string> = {
    "100 Meter Race": "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=800",
    "Long Jump": "https://images.unsplash.com/photo-1516223204216-ef79294fcc41?q=80&w=800",
    "Kho Kho": "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800",
    "Badminton": "https://images.unsplash.com/photo-1626224580175-340ad0e3aed7?q=80&w=800",
    "Chess": "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800",
    "Volleyball": "https://images.unsplash.com/photo-1592656091025-274df9d3f81c?q=80&w=800",
    "Marathon": "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=800",
    "Slow Cycle": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800",
    "Spoon with Lemon Race": "https://images.unsplash.com/photo-1511225594273-90776bd7b343?q=80&w=800",
    "Musical Chair": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800",
    "Musical Chair (Only Married Ladies)": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800"
  };

  return images[gameName] || "https://images.unsplash.com/photo-1461896756970-17e914046d90?q=80&w=800";
};

interface Game { id: string; name: string; }

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
      const { data, error } = await supabase.from("games").select("id, name").eq("is_active", true);
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

  const availableGames = games.filter(g => getAllowedGames().includes(g.name));

  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) => {
      if (prev.includes(gameId)) return prev.filter((id) => id !== gameId);
      if (prev.length >= 2) { toast.error("Maximum 2 games allowed"); return prev; }
      return [...prev, gameId];
    });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tower || !flatNo || !contact || !ageGroup || !gender) { toast.error("Fill all fields"); return; }
    setStep("games");
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (selectedGames.length === 0) { toast.error("Select at least 1 game"); return; }
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
    } catch (err) { toast.error("Submission failed"); } finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 p-10 rounded-3xl text-center border border-green-500/30">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white">Registered Successfully!</h1>
        <p className="text-slate-400 mt-2">Get ready to play! 🏆</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20 font-sans">
      {step === "details" ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <form onSubmit={handleDetailsSubmit} className="w-full max-w-lg bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-5">
            <div className="flex justify-center mb-2"><Trophy className="text-orange-500 w-12 h-12" /></div>
            <h2 className="text-3xl font-extrabold text-center text-white">RC Sports 2024</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full bg-slate-700/50 p-4 rounded-xl border border-slate-600" value={name} onChange={e => setName(e.target.value)} required />
              <input type="tel" placeholder="Mobile Number" className="w-full bg-slate-700/50 p-4 rounded-xl border border-slate-600" value={contact} onChange={e => setContact(e.target.value)} required />
              <div className="flex gap-4">
                <input type="text" placeholder="Tower" className="w-1/2 bg-slate-700/50 p-4 rounded-xl border border-slate-600" value={tower} onChange={e => setTower(e.target.value)} required />
                <input type="text" placeholder="Flat No" className="w-1/2 bg-slate-700/50 p-4 rounded-xl border border-slate-600" value={flatNo} onChange={e => setFlatNo(e.target.value)} required />
              </div>
              <div className="flex gap-4">
                <select className="w-1/2 bg-slate-700/50 p-4 rounded-xl border border-slate-600" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} required>
                  <option value="">Age</option>
                  {["5","6","7","8","9","10","11","12","13","14","15","16","17","18-34","35 & above"].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select className="w-1/2 bg-slate-700/50 p-4 rounded-xl border border-slate-600" value={gender} onChange={e => setGender(e.target.value)} required>
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              {showMaritalStatus && (
                <select className="w-full bg-slate-700/50 p-4 rounded-xl border border-slate-600" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} required>
                  <option value="">Marital Status</option>
                  <option value="Unmarried">Unmarried</option>
                  <option value="Married">Married</option>
                </select>
              )}
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 p-4 rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-orange-900/20">Next: Choose Games</button>
          </form>
        </div>
      ) : (
        <div className="container mx-auto px-4 pt-12 max-w-6xl">
          <header className="text-center mb-12">
            <h2 className="text-4xl font-black mb-2">Select Games</h2>
            <p className="text-orange-400 font-medium">Choose up to 2 sports to participate in</p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableGames.map(game => (
              <div 
                key={game.id} 
                onClick={() => toggleGame(game.id)} 
                className={`group cursor-pointer rounded-3xl overflow-hidden border-4 transition-all duration-300 ${selectedGames.includes(game.id) ? 'border-orange-500 bg-slate-800 scale-[1.02]' : 'border-slate-800 bg-slate-800/50 hover:border-slate-600'}`}
              >
                <div className="aspect-[16/10] relative">
                  <img src={getGameImage(game.name)} alt={game.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  {selectedGames.includes(game.id) && (
                    <div className="absolute inset-0 bg-orange-500/40 backdrop-blur-[2px] flex items-center justify-center">
                      <CheckCircle2 className="w-16 h-16 text-white drop-shadow-2xl" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">{game.name}</h3>
                </div>
              </div>
            ))}
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex justify-center z-50">
            <button 
              onClick={handleSubmit} 
              disabled={submitting || selectedGames.length === 0} 
              className="w-full max-w-md bg-green-600 hover:bg-green-500 disabled:opacity-40 p-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-green-900/20"
            >
              {submitting ? "Registering..." : `Confirm Registration (${selectedGames.length}/2)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;
