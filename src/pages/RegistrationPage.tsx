import { useState, useRef, useEffect } from "react";
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
  const [timeLeft, setTimeLeft] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const endDate = new Date("March 25, 2026 00:00:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;

      if (distance < 0) {
        setTimeLeft("Registrations Closed");
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const showMaritalStatus =
    gender === "Female" && (ageGroup === "18-34" || ageGroup === "35 & above");

  const getAllowedGames = () => {
    const mappingKey =
      gender === "Female" && maritalStatus === "Married"
        ? "Married"
        : ageGroup;
    const mapping = gender === "Male" ? boysMapping : girlsMapping;
    return mapping[mappingKey] || [];
  };

  const allowedGameNames = getAllowedGames();
  const availableGames = games.filter((g) =>
    allowedGameNames.includes(g.name)
  );

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
        if (regError.code === "23505") {
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
          <h1 className="font-heading text-5xl text-foreground mb-4">
            You're In!
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Registration successful. 🏆
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!registrationOpen ? (
        <div className="min-h-screen flex items-center justify-center px-4 text-center">
          <h2 className="font-heading text-3xl text-foreground">
            Registrations are closed
          </h2>
        </div>
      ) : (
        <div className="pb-16">
          {step === "details" && (
            <div
              className="min-h-screen flex items-center justify-center p-4 md:p-8"
              style={{
                background:
                  "linear-gradient(135deg, hsl(28 80% 30%), hsl(20 60% 15%))",
              }}
            >
              <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-[1fr_340px] rounded-3xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-xl border border-white/10">
                <div className="p-8 sm:p-12 flex flex-col justify-center">
                  <h2 className="font-heading text-4xl mb-2 text-center text-[#ff8c33]">
                    Register Now
                  </h2>

                  <p className="text-center text-white/80 mb-2">
                    Registrations are open until <b>25 March, 12:00 AM</b>
                  </p>

                  <div className="text-center text-lg font-semibold text-[#ff8c33] mb-6">
                    ⏳ {timeLeft}
                  </div>

                  <form
                    onSubmit={handleDetailsSubmit}
                    className="space-y-6"
                  >
