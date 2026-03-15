import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { boysMapping, girlsMapping } from "@/lib/gameMapping";
import { CheckCircle2, User, Phone, Home } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import sportsIllustration from "@/assets/sports-illustration.png";

// Updated image helper to find your Lovable game photos
const getGameImage = (url: string | null) => {
  if (!url) return "https://images.unsplash.com/photo-1461896756970-17e914046d90?q=80&w=2070";
  
  // If it's a full URL from Supabase storage, use it directly
  if (url.startsWith('http')) return url;
  
  // Lovable usually stores uploaded images in the assets folder or public directory
  // This ensures the path is formatted correctly for the browser
  return url.startsWith('/') ? url : `/${url}`;
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

  const allowedGameNames = getAllowedGames();
  const availableGames = games.filter(g => allowedGameNames.includes(g.name));

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
      toast.error("Please fill all fields!");
      return;
    }
    setStep("games");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (selectedGames.length === 0) {
      toast.error("Select at least 1 game!");
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
      toast.success("Registration successful! 🎉");
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Registration Successful!</h1>
          <p className="text-slate-400">Good luck in the games! 🏆</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {step === "details" ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-8 md:p-12">
              <h2 className="text-4xl font-bold mb-8 text-orange-500">Register Now</h2>
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                <input type="text" placeholder="Full Name" className="w-full bg-slate-700 p-4 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={name} onChange={e => setName(e.target.value)} required />
                <input type="tel" placeholder="Contact Number (10 digits)" className="w-full bg-slate-700 p-4 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" value={contact} onChange={e => setContact(e.target.value.replace(/\D/g, "").slice(0,10))} required />
                <div className="flex gap-4">
                  <input type="text" placeholder="Tower" className="w-1/2 bg-slate-700 p-4 rounded-xl" value={tower} onChange={e => setTower(e.target.value)} required />
                  <input type="text" placeholder="Flat No" className="w-1/2 bg-slate-700 p-4 rounded-xl" value={flatNo} onChange={e => setFlatNo(e.target.value)} required />
                </div>
                <div className="flex gap-4">
                  <select className="w-1/2 bg-slate-700 p-4 rounded-xl" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} required>
                    <option value="">Select Age</option>
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
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 p-4 rounded-xl font-bold text-xl transition-all">Next: Choose Games →</button>
              </form>
            </div>
            <div className="hidden md:block bg-slate-700">
              <img src={sportsIllustration} alt="Sports" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 pt-12">
          <div className="flex justify-between items-center mb-10 max-w-5xl mx-auto bg-slate-800 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-300">{name} | Age {ageGroup} | {gender}</p>
            <button onClick={() => setStep("details")} className="text-orange-500 hover:underline">Edit Info</button>
          </div>
          <h2 className="text-4xl font-bold text-center mb-12">Choose Your Games (Max 2)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {availableGames.map((game) => (
              <div 
                key={game.id} 
                onClick={() => toggleGame(game.id)} 
                className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${selectedGames.includes(game.id) ? 'border-orange-500 scale-105 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'border-slate-800 hover:border-slate-600'}`}
              >
                <div className="relative aspect-video">
                  <img src={getGameImage(game.image_url)} alt={game.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  {selectedGames.includes(game.id) && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
                <div className="p-5 bg-slate-800">
                  <h3 className="text-xl font-bold">{game.name}</h3>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <button 
              onClick={handleSubmit} 
              disabled={submitting || selectedGames.length === 0} 
              className="px-12 py-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-2xl shadow-xl transition-all"
            >
              {submitting ? "Processing..." : "Register Now 🏆"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;
