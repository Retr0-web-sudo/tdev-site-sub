import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <p className="font-body text-primary-foreground/60 text-sm tracking-wider">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-foreground flex flex-col items-center justify-center gap-4 section-padding">
        <h1 className="font-display text-3xl text-primary-foreground font-light">Access Denied</h1>
        <p className="font-body text-primary-foreground/60 text-sm">You don't have admin privileges.</p>
        <a href="/" className="font-body text-xs tracking-[0.2em] uppercase text-accent hover:underline">
          Return to Site
        </a>
      </div>
    );
  }

  return <AdminLayout />;
};

export default Admin;
