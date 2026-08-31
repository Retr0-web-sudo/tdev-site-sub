import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminInvite = () => {
  const [email, setEmail] = useState("");
  const [admins, setAdmins] = useState<{ user_id: string; email: string | null; role: string }[]>([]);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*");
    if (roles) {
      // Fetch profiles for each role
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const adminList = roles.map((r) => ({
        user_id: r.user_id,
        email: profiles?.find((p) => p.user_id === r.user_id)?.email || null,
        role: r.role,
      }));
      setAdmins(adminList);
    }
  };

  const inviteAdmin = async () => {
    if (!email) return;
    setInviting(true);

    // Look up user by email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .single();

    if (!profile) {
      toast.error("User not found. They must create an account first.");
      setInviting(false);
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: profile.user_id,
      role: "admin" as const,
    });

    setInviting(false);
    if (error) {
      if (error.code === "23505") toast.error("User is already an admin");
      else toast.error("Failed to add admin");
    } else {
      toast.success("Admin added!");
      setEmail("");
      loadAdmins();
    }
  };

  const removeAdmin = async (userId: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin" as any);
    toast.success("Admin removed");
    loadAdmins();
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-light mb-1">Invite Admin</h2>
      <p className="font-body text-sm text-muted-foreground mb-8">
        Add administrators to manage your site
      </p>

      {/* Invite form */}
      <div className="border border-border rounded-lg p-5 bg-card mb-8">
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
              Email Address
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="mt-1 bg-secondary border-border font-body text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={inviteAdmin}
              disabled={inviting || !email}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider"
            >
              <UserPlus size={14} className="mr-1" /> {inviting ? "Adding..." : "Add Admin"}
            </Button>
          </div>
        </div>
      </div>

      {/* Admin list */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">User</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Role</th>
              <th className="text-right px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center">
                  <Shield size={24} className="mx-auto mb-2 text-muted-foreground/40" />
                  <p className="font-body text-sm text-muted-foreground">No admins yet</p>
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.user_id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-body text-sm text-foreground">{admin.email || admin.user_id}</td>
                  <td className="px-5 py-3">
                    <span className="font-body text-xs px-2 py-1 rounded bg-accent/20 text-accent capitalize">
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => removeAdmin(admin.user_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInvite;
