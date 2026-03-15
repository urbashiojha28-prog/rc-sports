import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getGameImage } from "@/lib/gameImages";
import { boysMapping, girlsMapping } from "@/lib/gameMapping";
import { CheckCircle2, User, Phone, Home, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import sportsIllustration from "@/assets/sports-illustration.png";

interface Game {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

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
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
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

  const availableGames = games.filter((g) => getAllowedGames().includes(g.name));

  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) => {
      if (prev.includes(gameId)) return prev.filter((id) => id !== gameId);
      if (prev.length >= 2) {
        toast.error("You can select maximum 2 games!");
        return prev;
      }
      return [...prev, gameId];
    });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tower || !flatNo || !contact || !ageGroup || !gender) {
      toast.error("Please fill all required fields!");
      return;
    }
    setStep("games");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (selectedGames.length === 0) {
      toast.error("Please select at least one game!");
      return;
    }
    setSubmitting(true);
    try {
      const registrationId = crypto.randomUUID();
      const { error: regError } = await supabase.from("registrations").insert({
        id: registrationId,
        participant_name: name.trim(),
        tower: tower.trim(),
        flat_no: flatNo.trim(),
        contact_number: contact.trim(),
        class: ageGroup,
        gender: gender,
        marital_status: maritalStatus || "Unmarried",
      } as any);

      if (regError) throw regError;

      const gameInserts = selectedGames.map((gameId) => ({
        registration_id: registrationId,
        game_id: gameId,
      }));

      await supabase.from("registration_games").insert(gameInserts);
      setSubmitted(true);
      confetti();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Registration Successful!</h1>
          <p className="text-slate-600">Good luck in the games!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {step === "details" ? (
        <div className="flex flex-col md:flex-row min-h-screen">
          <div className="flex-1 flex items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-md space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Register</h1>
                <p className="text-slate-500">Fill in your details to participate</p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input type="text" placeholder="Full Name" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input type="tel" placeholder="Contact Number" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={contact} onChange={(e) => setContact(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Home className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input type="text" placeholder="Tower" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={tower} onChange={(e) => setTower(e.target.value)} required />
                    </div>
                    <input type="text" placeholder="Flat No" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={flatNo} onChange={(e) => setFlatNo(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} required>
                      <option value="">Age</option>
                      {["5","6","7","8","9","10","11","12","13","14","15","16","17","18-34","35 & above"].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white" value={gender} onChange={(e) => setGender(e.target.value)} required>
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  {showMaritalStatus && (
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} required>
                      <option value="">Marital Status</option>
                      <option value="Unmarried">Unmarried</option>
                      <option value="Married">Married</option>
                    </select>
                  )}
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all">Next: Choose Games</button>
              </form>
            </div>
          </div>
          <div className="hidden lg:flex flex-1 bg-slate-50 items-center justify-center p-12">
            <img src={sportsIllustration} alt="Sports" className="max-w-md w-full" />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
          {/* --- RESTORED EDIT OPTION --- */}
          <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep("details")} className="flex items-center gap-2 text-slate-600 hover:text-orange-500 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Edit Info
              </button>
              <div className="h-4 w-px bg-slate-300 mx-2 hidden md:block" />
              <p className="hidden md:block text-slate-500 text-sm">
                Registering for: <span className="font-bold text-slate-900">{name}</span> ({gender}, Age {ageGroup})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Selected</p>
              <p className="text-xl font-bold text-orange-500">{selectedGames.length} / 2</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-8">Choose Your Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableGames.map((game) => (
              <div key={game.id} onClick={() => toggleGame(game.id)} className={`group relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${selectedGames.includes(game.id) ? "border-orange-500 bg-orange-50 shadow-md" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                <div className="aspect-video relative overflow-hidden">
                  <img src={getGameImage(game.image_url)} alt={game.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  {selectedGames.includes(game.id) && <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center"><CheckCircle2 className="w-12 h-12 text-orange-500" /></div>}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900">{game.name}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-center z-50">
            <button onClick={handleSubmit} disabled={submitting || selectedGames.length === 0} className="w-full max-w-md bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-xl shadow-orange-200 transition-all">
              {submitting ? "Submitting..." : "Confirm Registration"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;
