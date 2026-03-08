import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! Ask the site owner to grant you admin access.");
        setIsSignup(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!roles || roles.length === 0 || !roles.some(r => r.role === "admin")) {
        await supabase.auth.signOut();
        toast.error("You don't have admin access.");
        return;
      }

      toast.success("Welcome, Admin! 🎉");
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card rounded-lg p-8 card-shadow ring-1 ring-border">
        <div className="flex justify-center mb-4">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        <h1 className="font-heading text-4xl text-foreground text-center mb-2">
          {isSignup ? "Create Account" : "Admin Login"}
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          {isSignup ? "Sign up to request admin access" : "Only authorized admins can access"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Password (min 6 characters)"
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-heading text-xl tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>
        <button
          onClick={() => setIsSignup(!isSignup)}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          {isSignup ? "Already have an account? Login" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
