import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getGameImage } from "@/lib/gameImages";
import { boysMapping, girlsMapping } from "@/lib/gameMapping";
import { CheckCircle2, User, Phone, Home } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import sportsIllustration from "@/assets/sports-illustration.png";

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
      if (prev.length >= 2) { toast.error("Maximum 2 games!"); return prev; }
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
        id: registrationId, participant_name: name.trim(), tower: tower.trim(), flat_no: flatNo.trim(),
        contact_number: contact.trim(), class: ageGroup, gender: gender, marital_status: maritalStatus || "Unmarried",
      } as any);
      if (regError) throw regError;
      const gameInserts = selectedGames.map((gameId) => ({ registration_id: registrationId, game_id: gameId }));
      await supabase.from("registration_games").insert(gameInserts);
      setSubmitted(true);
      confetti();
    } catch (err) { toast.error("Registration failed."); } finally { setSubmitting(false); }
  };

  if (submitted) return <div className="min-h-screen flex items-center justify-center text-center"><div><CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" /><h1 className="text-4xl font-bold">Success!</h1></div></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {step === "details" ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <form onSubmit={handleDetailsSubmit} className="w-full max-w-lg bg-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
            <h2 className="text-3xl font-bold text-orange-500 text-center">Registration</h2>
            <input type="text" placeholder="Full Name" className="w-full bg-slate-700 p-3 rounded" value={name} onChange={e => setName(e.target.value)} required />
            <input type="tel" placeholder="Contact Number" className="w-full bg-slate-700 p-3 rounded" value={contact} onChange={e => setContact(e.target.value)} required />
            <div className="flex gap-4">
              <input type="text" placeholder="Tower" className="w-1/2 bg-slate-700 p-3 rounded" value={tower} onChange={e => setTower(e.target.value)} required />
              <input type="text" placeholder="Flat No" className="w-1/2 bg-slate-700 p-3 rounded" value={flatNo} onChange={e => setFlatNo(e.target.value)} required />
            </div>
            <div className="flex gap-4">
              <select className="w-1/2 bg-slate-700 p-3 rounded" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} required>
                <option value="">Age</option>
                {["5","6","7","8","9","10","11","12","13","14","15","16","17","18-34","35 & above"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select className="w-1/2 bg-slate-700 p-3 rounded" value={gender} onChange={e => setGender(e.target.value)} required>
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            {showMaritalStatus && (
              <select className="w-full bg-slate-700 p-3 rounded" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} required>
                <option value="">Marital Status</option>
                <option value="Unmarried">Unmarried</option>
                <option value="Married">Married</option>
              </select>
            )}
            <button type="submit" className="w-full bg-orange-600 p-4 rounded-xl font-bold hover:bg-orange-700">Next: Choose Games</button>
          </form>
        </div>
      ) : (
        <div className="container mx-auto p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Select Games (Max 2)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableGames.map(game => (
              <div key={game.id} onClick={() => toggleGame(game.id)} className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${selectedGames.includes(game.id) ? 'border-orange-500 scale-105' : 'border-slate-700'}`}>
                <img src={getGameImage(game.image_url)} alt={game.name} className="w-full h-48 object-cover" />
                <div className="p-4 bg-slate-800"><h3>{game.name}</h3></div>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={submitting} className="mt-10 w-full max-w-md mx-auto block bg-green-600 p-4 rounded-xl font-bold">Register Now 🏆</button>
        </div>
      )}
    </div>
  );
};
export default RegistrationPage;
