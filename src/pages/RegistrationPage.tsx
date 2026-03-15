import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { boysMapping, girlsMapping } from "@/lib/gameMapping";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import sportsIllustration from "@/assets/sports-illustration.png";

// --- FIXED IMAGE HELPER ---
const getGameImage = (url: string | null, gameName: string) => {
  // If the URL is a full web link (from Supabase), use it
  if (url && url.startsWith('http')) return url;
  
  // If the URL exists as a local path, ensure it starts with a leading slash
  if (url && url.length > 2) {
    return url.startsWith('/') ? url : `/${url}`;
  }

  // FALLBACK: If no image is found, use a high-quality Unsplash image based on the game name
  const query = encodeURIComponent(gameName + " sports");
  return `https://images.unsplash.com/photo-1461896756970-17e914046d90?q=80&w=800&auto=format&fit=crop&keywords=${query}`;
};

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

  const availableGames = games.filter(g => getAllowedGames().includes(g.name));

  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) => {
      if (prev.includes(gameId)) return prev.filter((id) => id !== gameId);
      if (prev.length >= 2) { toast.error("You can select maximum 2 games!"); return prev; }
      return [...prev, gameId];
    });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tower || !flatNo || !contact || !ageGroup || !gender) { toast.error("Please fill all fields!"); return; }
    setStep("games");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (selectedGames.length === 0) { toast.error("Select at least 1 game!"); return; }
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
    } catch (err) { toast.error("Error submitting registration."); } finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="text-center">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold">Registration Successful!</h1>
        <p className="mt-4 text-slate-400">We'll see you at the games! 🏆</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {step === "details" ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <form onSubmit={handleDetailsSubmit} className="w-full max-w-lg bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-6">
            <h2 className="text-3xl font-bold text-orange-500 text-center">RC Sports Registration</h2>
            <input type="text" placeholder="Full Name" className="w-full bg-slate-700 p-4 rounded-xl" value={name} onChange={e => setName(e.target.value)} required />
            <input type="tel" placeholder="Contact" className="w-full bg-slate-700 p-4 rounded-xl" value={contact} onChange={e => setContact(e.target.value)} required />
            <div className="flex gap-4">
              <input type="text" placeholder="Tower" className="w-1/2 bg-slate-700 p-4 rounded-xl" value={tower} onChange={e => setTower(e.target.value)} required />
              <input type="text" placeholder="Flat" className="w-1/2 bg-slate-700 p-4 rounded-xl" value={flatNo} onChange={e => setFlatNo(e.target.value)} required />
            </div>
            <div className="flex gap-4">
              <select className="w-1/2 bg-slate-700 p-4 rounded-xl" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} required>
                <option value="">Age</option>
                {["5","6","7","8","9","10","11","12","13","14","15","16","17","18-34","35 & above"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select className="w-1/2 bg-slate-700 p-4 rounded-xl" value={gender} onChange={e => setGender(e.target.value)} required>
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            {showMaritalStatus && (
              <select className="w-full bg-slate-700 p-4 rounded-xl" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} required>
                <option value="">Marital Status</option>
                <option value="Unmarried">Unmarried</option>
                <option value="Married">Married</option>
              </select>
            )}
            <button type="submit" className="w-full bg-orange-600 p-4 rounded-xl font-bold text-xl">Next: Choose Games</button>
          </form>
        </div>
      ) : (
        <div className="container mx-auto px-4 pt-10">
          <h2 className="text-3xl font-bold text-center mb-10">Select Your Games (Max 2)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {availableGames.map(game => (
              <div 
                key={game.id} 
                onClick={() => toggleGame(game.id)} 
                className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${selectedGames.includes(game.id) ? 'border-orange-500 scale-105' : 'border-slate-800'}`}
              >
                <div className="aspect-video relative">
                  <img src={getGameImage(game.image_url, game.name)} alt={game.name} className="w-full h-full object-cover" />
                  {selectedGames.includes(game.id) && <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-white" /></div>}
                </div>
                <div className="p-4 bg-slate-800"><h3 className="font-bold text-lg">{game.name}</h3></div>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={submitting} className="mt-12 block mx-auto w-full max-w-md bg-green-600 p-5 rounded-2xl font-bold text-2xl shadow-lg">
            {submitting ? "Submitting..." : "Complete Registration 🏆"}
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;
