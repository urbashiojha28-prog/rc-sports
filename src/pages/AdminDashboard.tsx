import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Users, Gamepad2, Settings, Trash2, Plus, Save, Pencil, X, Check, Upload, Image, Download, Filter } from "lucide-react";
import { getGameImage } from "@/lib/gameImages";

interface Registration {
  id: string;
  participant_name: string;
  tower: string;
  flat_no: string;
  contact_number: string;
  created_at: string;
  games: string[];
}

interface Game {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"registrations" | "games" | "settings">("registrations");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [siteTitle, setSiteTitle] = useState("");
  const [siteSubtitle, setSiteSubtitle] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [heroImage, setHeroImage] = useState("");

  // New game state
  const [newGameName, setNewGameName] = useState("");
  const [newGameDesc, setNewGameDesc] = useState("");
  const [newGameImage, setNewGameImage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Editing game state
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState("");

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("game-images").upload(fileName, file);
      if (error) { toast.error("Upload failed: " + error.message); return null; }
      const { data: { publicUrl } } = supabase.storage.from("game-images").getPublicUrl(fileName);
      return publicUrl;
    } catch {
      toast.error("Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "new" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      if (target === "new") setNewGameImage(url);
      else setEditImage(url);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles || !roles.some(r => r.role === "admin")) { navigate("/admin"); return; }
      setIsAdmin(true);
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const { data: registrations = [] } = useQuery({
    queryKey: ["admin_registrations"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: regs, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
      if (error) throw error;

      const { data: regGames } = await supabase.from("registration_games").select("registration_id, game_id");
      const { data: allGames } = await supabase.from("games").select("id, name");

      const gameMap = new Map(allGames?.map(g => [g.id, g.name]) || []);

      return regs.map(r => ({
        ...r,
        games: (regGames || [])
          .filter(rg => rg.registration_id === r.id)
          .map(rg => gameMap.get(rg.game_id) || "Unknown"),
      })) as Registration[];
    },
  });

  const { data: games = [], refetch: refetchGames } = useQuery({
    queryKey: ["admin_games"],
    enabled: isAdmin,
    queryFn: async () => {
      // Admin can see all games including inactive - use a direct query
      const { data, error } = await supabase.from("games").select("*").order("display_order");
      if (error) throw error;
      return data as Game[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["admin_settings"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*");
      const map: Record<string, string> = {};
      data?.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
      setSiteTitle(map.site_title || "");
      setSiteSubtitle(map.site_subtitle || "");
      setRegistrationOpen(map.registration_open !== "false");
      setHeroImage(map.hero_image || "");
      return map;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const handleSaveSettings = async () => {
    const updates = [
      { key: "site_title", value: siteTitle },
      { key: "site_subtitle", value: siteSubtitle },
      { key: "registration_open", value: registrationOpen ? "true" : "false" },
      { key: "hero_image", value: heroImage },
    ];
    for (const u of updates) {
      await supabase.from("site_settings").update({ value: u.value }).eq("key", u.key);
    }
    toast.success("Settings saved!");
    queryClient.invalidateQueries({ queryKey: ["admin_settings"] });
  };

  const handleAddGame = async () => {
    if (!newGameName.trim()) { toast.error("Game name is required"); return; }
    const maxOrder = Math.max(0, ...games.map(g => g.display_order));
    const { error } = await supabase.from("games").insert({
      name: newGameName.trim(),
      description: newGameDesc.trim() || null,
      image_url: newGameImage.trim() || null,
      display_order: maxOrder + 1,
    });
    if (error) { toast.error("Failed to add game"); return; }
    setNewGameName(""); setNewGameDesc(""); setNewGameImage("");
    toast.success("Game added!");
    refetchGames();
  };

  const handleToggleGame = async (game: Game) => {
    await supabase.from("games").update({ is_active: !game.is_active }).eq("id", game.id);
    refetchGames();
  };

  const handleDeleteRegistration = async (id: string) => {
    await supabase.from("registrations").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin_registrations"] });
    toast.success("Registration deleted");
  };

  const startEditing = (game: Game) => {
    setEditingGameId(game.id);
    setEditName(game.name);
    setEditDesc(game.description || "");
    setEditImage(game.image_url || "");
  };

  const handleSaveGame = async () => {
    if (!editingGameId || !editName.trim()) return;
    const { error } = await supabase.from("games").update({
      name: editName.trim(),
      description: editDesc.trim() || null,
      image_url: editImage.trim() || null,
    }).eq("id", editingGameId);
    if (error) { toast.error("Failed to update game"); return; }
    setEditingGameId(null);
    toast.success("Game updated!");
    refetchGames();
  };

  const filteredRegistrations = gameFilter === "all"
    ? registrations
    : registrations.filter(r => r.games.includes(gameFilter));

  const handleExportCSV = () => {
    const data = filteredRegistrations;
    if (data.length === 0) { toast.error("No data to export"); return; }
    const headers = ["Name", "Tower", "Flat", "Contact", "Games", "Date"];
    const rows = data.map(r => [
      r.participant_name,
      r.tower,
      r.flat_no,
      r.contact_number,
      r.games.join("; "),
      new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations${gameFilter !== "all" ? `-${gameFilter}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-heading text-3xl text-foreground">Admin Panel</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          {[
            { key: "registrations" as const, icon: Users, label: "Registrations" },
            { key: "games" as const, icon: Gamepad2, label: "Games" },
            { key: "settings" as const, icon: Settings, label: "Settings" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Registrations Tab */}
        {activeTab === "registrations" && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-heading text-2xl text-foreground">
                Registrations ({filteredRegistrations.length})
              </h2>
              <div className="flex gap-2 flex-wrap">
                {/* Game Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-md bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Games</option>
                    {games.map(g => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>
                {/* CSV Export */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>
            {filteredRegistrations.length === 0 ? (
              <p className="text-muted-foreground">No registrations{gameFilter !== "all" ? ` for ${gameFilter}` : ""} yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tower</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Flat</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Contact</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Games</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map(reg => (
                      <tr key={reg.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-foreground">{reg.participant_name}</td>
                        <td className="py-3 px-4 text-foreground">{reg.tower}</td>
                        <td className="py-3 px-4 text-foreground">{reg.flat_no}</td>
                        <td className="py-3 px-4 text-foreground">{reg.contact_number}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {reg.games.map(g => (
                              <span key={g} className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{g}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(reg.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => handleDeleteRegistration(reg.id)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Games Tab */}
        {activeTab === "games" && (
          <div>
            <h2 className="font-heading text-2xl text-foreground mb-4">Manage Games</h2>

            {/* Add Game */}
            <div className="bg-card rounded-lg p-4 ring-1 ring-border mb-6">
              <h3 className="font-heading text-xl text-foreground mb-3">Add New Game</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="px-4 py-2 rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Game name"
                />
                <input
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                  className="px-4 py-2 rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Description"
                />
                <div className="flex gap-2 items-center">
                  <select
                    value={newGameImage.startsWith("http") ? "" : newGameImage}
                    onChange={(e) => setNewGameImage(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-md bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select preset image</option>
                    <option value="cricket">Cricket</option>
                    <option value="badminton">Badminton</option>
                    <option value="chess">Chess</option>
                    <option value="carrom">Carrom</option>
                    <option value="table-tennis">Table Tennis</option>
                    <option value="tug-of-war">Tug of War</option>
                  </select>
                  <label className="cursor-pointer px-3 py-2 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm hidden md:inline">{uploading ? "Uploading..." : "Upload"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "new")} disabled={uploading} />
                  </label>
                  <button onClick={handleAddGame} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {newGameImage.startsWith("http") && (
                  <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
                    <Image className="w-4 h-4" /> Custom image uploaded ✓
                  </div>
                )}
              </div>
            </div>

            {/* Game List */}
            <div className="grid gap-3">
              {games.map(game => (
                <div key={game.id} className="flex items-center gap-4 bg-card rounded-lg p-4 ring-1 ring-border">
                  <img src={getGameImage(editingGameId === game.id ? editImage : game.image_url)} alt={game.name} className="w-16 h-16 rounded-md object-cover" />
                  {editingGameId === game.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="px-3 py-2 rounded-md bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Name" />
                      <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="px-3 py-2 rounded-md bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Description" />
                      <select value={editImage.startsWith("http") ? "" : editImage} onChange={e => setEditImage(e.target.value)} className="px-3 py-2 rounded-md bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">{editImage.startsWith("http") ? "Custom image" : "No image"}</option>
                        <option value="cricket">Cricket</option>
                        <option value="badminton">Badminton</option>
                        <option value="chess">Chess</option>
                        <option value="carrom">Carrom</option>
                        <option value="table-tennis">Table Tennis</option>
                        <option value="tug-of-war">Tug of War</option>
                      </select>
                      <label className="cursor-pointer px-3 py-2 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">{uploading ? "..." : "Upload"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "edit")} disabled={uploading} />
                      </label>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <h3 className="font-heading text-xl text-foreground">{game.name}</h3>
                      <p className="text-muted-foreground text-sm">{game.description}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {editingGameId === game.id ? (
                      <>
                        <button onClick={handleSaveGame} className="p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingGameId(null)} className="p-2 rounded-md bg-muted text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <button onClick={() => startEditing(game)} className="p-2 rounded-md text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    )}
                    <button
                      onClick={() => handleToggleGame(game)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        game.is_active ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {game.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-lg">
            <h2 className="font-heading text-2xl text-foreground mb-4">Site Settings</h2>
            <div className="bg-card rounded-lg p-6 ring-1 ring-border space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Site Title</label>
                <input
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Subtitle</label>
                <input
                  value={siteSubtitle}
                  onChange={(e) => setSiteSubtitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Hero Background Image</label>
                <div className="flex gap-2 items-center">
                  {heroImage && (
                    <img src={heroImage} alt="Hero preview" className="w-16 h-10 rounded object-cover ring-1 ring-border" />
                  )}
                  <label className="cursor-pointer flex-1 px-4 py-3 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? "Uploading..." : heroImage ? "Change Image" : "Upload Image"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      if (url) setHeroImage(url);
                    }} disabled={uploading} />
                  </label>
                  {heroImage && (
                    <button onClick={() => setHeroImage("")} className="p-2 rounded-md text-destructive hover:text-destructive/80">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">This image appears behind the title on the homepage. Click Save to apply.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground">Registration Open</label>
                <button
                  onClick={() => setRegistrationOpen(!registrationOpen)}
                  className={`w-12 h-6 rounded-full transition-colors ${registrationOpen ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-foreground transition-transform ${registrationOpen ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-heading text-lg hover:opacity-90 transition-opacity"
              >
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
