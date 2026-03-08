import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getGameImage } from "@/lib/gameImages";
import { getAvailableGameNames } from "@/lib/gameMapping";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import heroBanner from "@/assets/hero-banner.jpg";
import sportsIllustration from "@/assets/sports-illustration.png";
import { User, Phone, Home, GraduationCap } from "lucide-react";

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
  const [studentClass, setStudentClass] = useState("");
  const [gender, setGender] = useState("");
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

  const siteTitle = settings?.site_title || "Society Games Championship 2026";
  const siteSubtitle = settings?.site_subtitle || "Register now and compete!";
  const registrationOpen = settings?.registration_open !== "false";

  // Filter games based on class + gender
  const allowedGameNames = getAvailableGameNames(studentClass, gender);
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
    if (!name.trim() || !tower.trim() || !flatNo.trim() || !contact.trim() || !studentClass || !gender) {
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
          class: studentClass.trim(),
          gender: gender,
        });

      if (regError) {
        if (regError.code === '23505' || regError.message?.includes('duplicate') || regError.message?.includes('unique')) {
          toast.error("This person is already registered! Each person can only register once.");
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
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center animate-fade-in-up">
          <CheckCircle2 className="w-20 h-20 text-secondary mx-auto mb-6" />
          <h1 className="font-heading text-5xl text-foreground mb-4">You're In!</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your registration has been submitted successfully. Get ready to compete! 🏆
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!registrationOpen ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground">Registrations are currently closed</h2>
            <p className="text-muted-foreground mt-4">Check back later!</p>
          </div>
        </div>
      ) : (
        <div className="pb-16">
          {step === "details" && (
            <div
              className="min-h-screen flex items-center justify-center p-4 md:p-8"
              style={{
                background: 'linear-gradient(135deg, hsl(28 80% 30%), hsl(20 60% 15%), hsl(28 90% 25%))',
              }}
            >
              <div
                className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-[1fr_340px] rounded-3xl overflow-hidden"
                ref={formRef}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Left: Form */}
                <div className="p-8 sm:p-10 md:p-12 flex flex-col justify-center">
                  <h2
                    className="font-heading text-4xl sm:text-5xl mb-8 text-center"
                    style={{ color: 'hsl(28, 100%, 55%)' }}
                  >
                    Register Now
                  </h2>

                  <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    {/* Full Name */}
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-foreground/20 py-3 px-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-base"
                        placeholder="Full Name"
                        maxLength={100}
                        required
                      />
                      <User className="absolute right-1 top-3.5 w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Contact */}
                    <div className="relative">
                      <input
                        type="tel"
                        value={contact}
                        onChange={(e) => setContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full bg-transparent border-b-2 border-foreground/20 py-3 px-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-base"
                        placeholder="Contact Number"
                        required
                      />
                      <Phone className="absolute right-1 top-3.5 w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Tower & Flat */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="relative">
                        <input
                          type="text"
                          value={tower}
                          onChange={(e) => setTower(e.target.value)}
                          className="w-full bg-transparent border-b-2 border-foreground/20 py-3 px-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-base"
                          placeholder="Tower"
                          maxLength={50}
                          required
                        />
                        <Home className="absolute right-1 top-3.5 w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={flatNo}
                          onChange={(e) => setFlatNo(e.target.value)}
                          className="w-full bg-transparent border-b-2 border-foreground/20 py-3 px-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-base"
                          placeholder="Flat No"
                          maxLength={20}
                          required
                        />
                      </div>
                    </div>

                    {/* Class & Gender */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="relative">
                        <select
                          value={studentClass}
                          onChange={(e) => setStudentClass(e.target.value)}
                          className="w-full bg-transparent border-b-2 border-foreground/20 py-3 px-1 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none text-base cursor-pointer"
                          required
                        >
                          <option value="" className="bg-card text-foreground">Class</option>
                          {["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th","Senior"].map(c => (
                            <option key={c} value={c} className="bg-card text-foreground">{c}</option>
                          ))}
                        </select>
                        <GraduationCap className="absolute right-1 top-3.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                      </div>
                      <div>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-transparent border-b-2 border-foreground/20 py-3 px-1 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none text-base cursor-pointer"
                          required
                        >
                          <option value="" className="bg-card text-foreground">Gender</option>
                          <option value="Male" className="bg-card text-foreground">Male</option>
                          <option value="Female" className="bg-card text-foreground">Female</option>
                          <option value="Other" className="bg-card text-foreground">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-4 rounded-full font-heading text-xl tracking-wider text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, hsl(28, 100%, 40%), hsl(20, 80%, 20%))',
                        boxShadow: '0 8px 25px hsl(28 100% 30% / 0.5)',
                      }}
                    >
                      Next: Choose Games →
                    </button>
                  </form>
                </div>

                {/* Right: Image (exact copy from reference) */}
                <div className="hidden md:block relative p-4">
                  <img
                    src={sportsIllustration}
                    alt="Registration"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          )}

          {step === "games" && (
            <div className="container mx-auto px-4 pt-8">
              {/* Summary bar */}
              <div className="max-w-5xl mx-auto mb-6">
                <div className="bg-card rounded-lg p-4 ring-1 ring-border flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{name}</span> · {studentClass} · {gender} · {tower}, {flatNo}
                  </div>
                  <button
                    onClick={() => setStep("details")}
                    className="text-sm text-primary hover:underline"
                  >
                    ← Edit Details
                  </button>
                </div>
              </div>

              <section className="mb-8">
                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground text-center mb-2">
                  Choose Your Games
                </h2>
                <p className="text-muted-foreground text-center mb-8 text-sm sm:text-base">
                  Select minimum 1 and maximum 2 games
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-5xl mx-auto">
                  {availableGames.map((game, i) => {
                    const isSelected = selectedGames.includes(game.id);
                    return (
                      <button
                        key={game.id}
                        onClick={() => toggleGame(game.id)}
                        className={`relative rounded-xl overflow-hidden group text-left animate-fade-in-up transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 ${
                          isSelected
                            ? "ring-2 ring-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                            : "ring-1 ring-border hover:ring-primary/50 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)]"
                        }`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <div className="aspect-[4/3] sm:aspect-square overflow-hidden">
                          <img
                            src={getGameImage(game.image_url)}
                            alt={game.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                        </div>
                        <div className="p-3 sm:p-4 bg-card">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="font-heading text-lg sm:text-2xl text-foreground truncate">{game.name}</h3>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 animate-scale-in" />
                            )}
                          </div>
                          {game.description && (
                            <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2">{game.description}</p>
                          )}
                        </div>
                        {isSelected && <div className="absolute inset-0 bg-primary/10 pointer-events-none" />}
                      </button>
                    );
                  })}
                </div>

                {availableGames.length === 0 && (
                  <p className="text-center text-muted-foreground mt-8">No games available for your class and gender combination.</p>
                )}
              </section>

              {/* Selected games summary + submit */}
              <section className="max-w-lg mx-auto">
                <div className="bg-card rounded-xl p-5 sm:p-6 ring-1 ring-border">
                  {selectedGames.length > 0 && (
                    <div className="bg-muted rounded-lg p-3 mb-4">
                      <p className="text-sm text-muted-foreground">
                        Selected games:{" "}
                        <span className="text-primary font-medium">
                          {games
                            .filter((g) => selectedGames.includes(g.id))
                            .map((g) => g.name)
                            .join(", ")}
                        </span>
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || selectedGames.length === 0}
                    className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-heading text-xl tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {submitting ? "Registering..." : "Register Now 🏆"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      <footer className="border-t border-border py-6 text-center">
        <p className="text-muted-foreground text-sm">Society Games Championship © 2026</p>
      </footer>
    </div>
  );
};

export default RegistrationPage;
