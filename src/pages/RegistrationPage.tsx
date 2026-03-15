import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getGameImage } from "@/lib/gameImages";
import { boysMapping, girlsMapping } from "@/lib/gameMapping";
import { CheckCircle2, User, Phone, Home } from "lucide-react";
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
  const formRef = useRef<HTMLDivElement>(null);

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

  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      data.forEach((s: { key: string; value: string }) => {
        map[s.key] = s.value;
      });
      return map;
    },
  });

  const registrationOpen = settings?.registration_open !== "false";

  // Logic to show Marital Status dropdown
  // Only for Females who are 18-34 or 35 & above
  const showMaritalStatus = gender === "Female" && (ageGroup === "18-34" || ageGroup === "35 & above");

  // Filter games based on age group + gender + marital status
  const getAllowedGames = () => {
    // If Female and Married is selected, prioritize the "Married" mapping key
    const mappingKey = (gender === "Female" && maritalStatus === "Married") ? "Married" : ageGroup;
    const mapping = gender === "Male" ? boysMapping : girlsMapping;
    return mapping[mappingKey] || [];
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

  const fireConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#f97316", "#22c55e", "#3b82f6", "#eab308", "#ef4444"];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tower.trim() || !flatNo.trim() || !contact.trim() || !ageGroup || !gender) {
      toast.error("Please fill all fields!");
      return;
    }
    if (!/^\d{10}$/.test(contact)) {
      toast.error("Please enter a valid 10-digit contact number!");
      return;
    }
    setSelectedGames([]);
    setStep("games");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (selectedGames.length === 0) {
      toast.error("Please select at least 1 game!");
      return;
    }

    setSubmitting(true);
    try {
      const registrationId = crypto.randomUUID();
      const { error: regError } = await supabase
        .from("registrations")
        .insert({
          id: registrationId,
          participant_name: name.trim(),
          tower: tower.trim(),
          flat_no: flatNo.trim(),
          contact_number: contact.trim(),
          class: ageGroup,
          gender: gender,
          marital_status: maritalStatus || "Unmarried",
        } as any);

      if (regError) {
        if (regError.code === '23505') {
          toast.error("This person is already registered!");
          setSubmitting(false);
          return;
        }
        throw regError;
      }

      const gameInserts = selectedGames.map((gameId) => ({
        registration_id: registrationId,
        game_id: gameId,
      }));

      const { error: gamesError } = await supabase
        .from("registration_games")
        .insert(gameInserts);

      if (gamesError) throw gamesError;

      setSubmitted(true);
      fireConfetti();
      toast.success("Registration successful! 🎉");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center animate-fade-in-up max-w-md mx-auto">
          <CheckCircle2 className="w-20 h-20 text-secondary mx-auto mb-6" />
          <h1 className="font-heading text-5xl text-foreground mb-4">You're In!</h1>
          <p className="text-muted-foreground text-lg mb-8">Registration successful. 🏆</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!registrationOpen ? (
        <div className="min-h-screen flex items-center justify-center px-4 text-center">
          <h2 className="font-heading text-3xl text-foreground">Registrations are closed</h2>
        </div>
      ) : (
        <div className="pb-16">
          {step === "details" && (
            <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ background: 'linear-gradient(135deg, hsl(28 80% 30%), hsl(20 60% 15%))' }}>
              <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-[1fr_340px] rounded-3xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-xl border border-white/10">
                <div className="p-8 sm:p-12 flex flex-col justify-center">
                  <h2 className="font-heading text-4xl mb-8 text-center text-[#ff8c33]">Register Now</h2>
                  <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    <div className="relative">
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff8c33]" placeholder="Full Name" required />
                      <User className="absolute right-1 top-3.5 w-5 h-5 text-white/50" />
                    </div>
                    <div className="relative">
                      <input type="tel" value={contact} onChange={(e) => setContact(e.target.value.replace(/\D/g, "").slice(0, 10))} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff8c33]" placeholder="Contact Number" required />
                      <Phone className="absolute right-1 top-3.5 w-5 h-5 text-white/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="relative">
                        <input type="text" value={tower} onChange={(e) => setTower(e.target.value)} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff8c33]" placeholder="Tower" required />
                        <Home className="absolute right-1 top-3.5 w-5 h-5 text-white/50" />
                      </div>
                      <input type="text" value={flatNo} onChange={(e) => setFlatNo(e.target.value)} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff8c33]" placeholder="Flat No" required />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-white focus:outline-none focus:border-[#ff8c33] cursor-pointer appearance-none" required>
                        <option value="" className="text-black">Select Age</option>
                        {["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18-34", "35 & above"].map(a => (
                          <option key={a} value={a} className="text-black">{a}</option>
                        ))}
                      </select>

                      <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-white focus:outline-none focus:border-[#ff8c33] cursor-pointer appearance-none" required>
                        <option value="" className="text-black">Gender</option>
                        <option value="Male" className="text-black">Male</option>
                        <option value="Female" className="text-black">Female</option>
                      </select>
                    </div>

                    {showMaritalStatus && (
                      <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-white focus:outline-none focus:border-[#ff8c33] cursor-pointer appearance-none" required>
                        <option value="" className="text-black">Marital Status</option>
                        <option value="Unmarried" className="text-black">Unmarried</option>
                        <option value="Married" className="text-black">Married</option>
                      </select>
                    )}

                    <button type="submit" className="w-full py-4 rounded-full font-heading text-xl text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #ff8c33, #b35900)' }}>
                      Next: Choose Games →
                    </button>
                  </form>
                </div>
                <div className="hidden md:block p-4">
                  <img src={sportsIllustration} alt="Sports" className="w-full h-full object-cover rounded-2xl" />
                </div>
              </div>
            </div>
          )}

          {step === "games" && (
            <div className="container mx-auto px-4 pt-8">
              <div className="max-w-5xl mx-auto mb-6 bg-card rounded-lg p-4 flex justify-between items-center ring-1 ring-border">
                <span className="text-sm">{name} · Age {ageGroup} · {gender}</span>
                <button onClick={() => setStep("details")} className="text-sm text-primary underline">Edit Details</button>
              </div>

              <h2 className="font-heading text-4xl text-center mb-8">Choose Your Games</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {availableGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => toggleGame(game.id)}
                    className={`relative rounded-xl overflow-hidden ring-1 transition-all ${selectedGames.includes(game.id) ? "ring-4 ring-primary scale-105" : "ring-border"}`}
                  >
                    <img src={getGameImage(game.image_url)} alt={game.name} className="w-full aspect-video object-cover" />
                    <div className="p-4 bg-card text-left">
                      <h3 className="font-heading text-xl">{game.name}</h3>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-12 max-w-lg mx-auto">
                <button onClick={handleSubmit} disabled={submitting || selectedGames.length === 0} className="w-full py-4 rounded-lg bg-primary text-white font-heading text-2xl disabled:opacity-50">
                  {submitting ? "Registering..." : "Register Now 🏆"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;
