import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { boysMapping, girlsMapping } from "@/lib/gameMapping";
import { CheckCircle2, User, Phone, Home, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import sportsIllustration from "@/assets/sports-illustration.png";

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
    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      await supabase.from("registrations").insert({
        id, participant_name: name, tower, flat_no: flatNo, contact_number: contact, class: ageGroup, gender, marital_status: maritalStatus || "Unmarried"
      } as any);
      const gameInserts = selectedGames.map(game_id => ({ registration_id: id, game_id }));
      await supabase.from("registration_games").insert(gameInserts);
      setSubmitted(true);
      confetti();
    } catch (e) { toast.error("Failed to register"); } finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-center">
      <div>
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-slate-900">Success!</h1>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {step === "details" ? (
        <div className="flex flex-col md:flex-row min-h-screen">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-6">
              <h1 className="text-4xl font-bold text-slate-900">Register</h1>
              <p className="text-slate-500">Fill in your details to participate</p>
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="relative"><User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input placeholder="Full Name" className="w-full pl-10 p-3 border rounded-xl text-slate-900" value={name} onChange={e => setName(e.target.value)} required /></div>
                <div className="relative"><Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input placeholder="Contact Number" className="w-full pl-10 p-3 border rounded-xl text-slate-900" value={contact} onChange={e => setContact(e.target.value)} required /></div>
                <div className="flex gap-4"><input placeholder="Tower" className="w-1/2 p-3 border rounded-xl text-slate-900" value={tower} onChange={e => setTower(e.target.value)} required /><input placeholder="Flat No" className="w-1/2 p-3 border rounded-xl text-slate-900" value={flatNo} onChange={e => setFlatNo(e.target.value)} required /></div>
                <div className="flex gap-4">
                  <select className="w-1/2 p-3 border rounded-xl text-slate-900 bg-white" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} required>
                    <option value="">Age</option>
                    {["5","6","7","8","9","10","11","12","13","14","15","16","17","18-34","35 & above"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select className="w-1/2 p-3 border rounded-xl text-slate-900 bg-white" value={gender} onChange={e => setGender(e.target.value)} required>
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                {showMaritalStatus && <select className="w-full p-3 border rounded-xl text-slate-900 bg-white" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} required><option value="">Marital Status</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option></select>}
                <button type="submit" className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold hover:bg-orange-600 transition-colors">Next: Choose Games</button>
              </form>
            </div>
          </div>
          <div className="hidden md:flex flex-1 bg-slate-50 items-center justify-center p-12">
             <img src={sportsIllustration} className="max-w-md w-full" />
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-xl">
             <button onClick={() => setStep("details")} className="flex items-center gap-2 text-slate-600 hover:text-orange-600 font-bold"><ArrowLeft className="w-4 h-4" /> Edit Info</button>
             <p className="font-bold text-orange-500">{selectedGames.length} / 2 Selected</p>
          </div>
          <h2 className="text-3xl font-bold mb-8">Choose Your Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableGames.map(game => (
              <div key={game.id} onClick={() => toggleGame(game.id)} className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${selectedGames.includes(game.id) ? 'border-orange-500 bg-orange-50 scale-105' : 'border-slate-100'}`}>
                <img src={getGameImage(game.image_url)} className="w-full h-48 object-cover" />
                <div className="p-4"><h3 className="font-bold text-lg text-slate-900">{game.name}</h3></div>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={submitting || selectedGames.length === 0} className="mt-12 w-full max-w-md mx-auto block bg-orange-500 text-white p-4 rounded-xl font-bold shadow-xl">
            {submitting ? "Registering..." : "Confirm Registration"}
          </button>
        </div>
      )}
    </div>
  );
};
export default RegistrationPage;
