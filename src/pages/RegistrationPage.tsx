import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getGameImage } from "@/lib/gameImages";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import heroBanner from "@/assets/hero-banner.jpg";

interface Game {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

const RegistrationPage = () => {
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [tower, setTower] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [contact, setContact] = useState("");
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
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGames.length === 0) {
      toast.error("Please select at least 1 game!");
      return;
    }
    if (!name.trim() || !tower.trim() || !flatNo.trim() || !contact.trim()) {
      toast.error("Please fill all fields!");
      return;
    }
    if (!/^\d{10}$/.test(contact)) {
      toast.error("Please enter a valid 10-digit contact number!");
      return;
    }

    setSubmitting(true);
    try {
      const { data: reg, error: regError } = await supabase
        .from("registrations")
        .insert({
          participant_name: name.trim(),
          tower: tower.trim(),
          flat_no: flatNo.trim(),
          contact_number: contact.trim(),
        })
        .select("id")
        .single();

      if (regError) throw regError;

      const gameInserts = selectedGames.map((gameId) => ({
        registration_id: reg.id,
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
          <h1 className="font-heading text-5xl text-foreground mb-4">
            You're In!
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your registration has been submitted successfully. Get ready to compete! 🏆
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url(${settings?.hero_image && settings.hero_image.startsWith("http") ? settings.hero_image : heroBanner})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        <div className="relative z-10 container mx-auto px-4 py-12 md:py-24 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-gradient mb-4 animate-fade-in-up">
            {siteTitle}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {siteSubtitle}
          </p>
          {/* WhatsApp Share Button */}
          <button
            onClick={handleWhatsAppShare}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition-all hover:scale-105 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Share2 className="w-4 h-4" />
            Share with Neighbors
          </button>
        </div>
      </div>

      {!registrationOpen ? (
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground">Registrations are currently closed</h2>
          <p className="text-muted-foreground mt-4">Check back later!</p>
        </div>
      ) : (
        <div className="container mx-auto px-4 pb-16">
          {/* Games Selection */}
          <section className="mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground text-center mb-2">
              Choose Your Games
            </h2>
            <p className="text-muted-foreground text-center mb-8 text-sm sm:text-base">
              Select minimum 1 and maximum 2 games
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-5xl mx-auto">
              {games.map((game, i) => {
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
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                    </div>
                    <div className="p-3 sm:p-4 bg-card">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-heading text-lg sm:text-2xl text-foreground truncate">
                          {game.name}
                        </h3>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 animate-scale-in" />
                        )}
                      </div>
                      {game.description && (
                        <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2">
                          {game.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Registration Form */}
          <section className="max-w-lg mx-auto" ref={formRef}>
            <div className="bg-card rounded-xl p-5 sm:p-6 md:p-8 ring-1 ring-border shadow-[0_8px_40px_hsl(var(--primary)/0.08)]">
              <h2 className="font-heading text-2xl sm:text-3xl text-foreground mb-6 text-center">
                Your Details
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="Enter your full name"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Tower
                    </label>
                    <input
                      type="text"
                      value={tower}
                      onChange={(e) => setTower(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="e.g. Tower A"
                      maxLength={50}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Flat No
                    </label>
                    <input
                      type="text"
                      value={flatNo}
                      onChange={(e) => setFlatNo(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="e.g. 101"
                      maxLength={20}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    placeholder="10-digit number"
                    required
                  />
                </div>

                {selectedGames.length > 0 && (
                  <div className="bg-muted rounded-lg p-3">
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
                  type="submit"
                  disabled={submitting || selectedGames.length === 0}
                  className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-heading text-xl tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? "Registering..." : "Register Now 🏆"}
                </button>
              </form>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-muted-foreground text-sm">
          Society Games Championship © 2026
        </p>
      </footer>
    </div>
  );
};

export default RegistrationPage;
