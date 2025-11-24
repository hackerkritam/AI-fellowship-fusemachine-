import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Shield, User as UserIcon, LogOut, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // Auto-refresh applications every 3 seconds
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchApplications(user.id, isAdmin);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isAdmin]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const adminRole = roles?.find((r) => r.role === "admin");
      setIsAdmin(!!adminRole);

      // Fetch applications
      await fetchApplications(user.id, !!adminRole);
    } catch (error: any) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (userId: string, isAdmin: boolean) => {
    try {
      let query = supabase.from("kyc_applications").select("*").order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching applications",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleBecomeAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert admin role
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "admin",
        });

      if (error && !error.message.includes("duplicate")) {
        throw error;
      }

      // Refresh page to update admin status
      setIsAdmin(true);
      toast({
        title: "Success",
        description: "You are now an admin! Refresh to see admin features.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteApplication = async (e: React.MouseEvent, appId: string, status: string) => {
    e.stopPropagation();

    // Only allow deleting pending applications
    if (status !== "pending") {
      toast({
        title: "Cannot Delete",
        description: "Only pending applications can be deleted.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete from database
      const { error } = await supabase
        .from("kyc_applications")
        .delete()
        .eq("id", appId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application deleted successfully.",
      });

      // Refresh applications list
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchApplications(user.id, isAdmin);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      under_review: { variant: "outline", icon: Clock },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Hamro Nepali KYC</h1>
              <p className="text-sm text-muted-foreground">Fusemachine Fellowship • {isAdmin ? "Admin Dashboard" : "User Dashboard"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              {isAdmin && <Badge variant="default" className="text-xs">Admin</Badge>}
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAdmin && (
          <div className="mb-8 space-y-4">
            <Button onClick={() => navigate("/kyc-form")} size="lg" className="gap-2">
              <FileText className="w-5 h-5" />
              Submit New KYC Application
            </Button>
            
            {/* Demo Button for NEW User Application Detail Page */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">✨ NEW: View Application Details</p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/application/demo-id")}
                className="gap-2"
              >
                Demo: User Application Detail View
              </Button>
            </div>

            {/* Admin Setup Button */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">👨‍💼 Want to test Admin Panel?</p>
              <Button 
                variant="outline" 
                onClick={handleBecomeAdmin}
                className="gap-2"
              >
                Click to Become Admin
              </Button>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="mb-8 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">✨ NEW: Admin Review Interface</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/review/demo-id")}
              className="gap-2"
            >
              Demo: Admin KYC Review Page
            </Button>
          </div>
        )}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {isAdmin ? "All KYC Applications" : "Your KYC Applications"}
            </CardTitle>
            <CardDescription>
              {applications.length} application(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isAdmin ? "No applications submitted yet" : "You haven't submitted any KYC applications"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(isAdmin ? `/admin/review/${app.id}` : `/application/${app.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{app.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        {app.aadhaar_number && (
                          <p className="text-sm text-muted-foreground">Aadhaar: ••••{app.aadhaar_number.slice(-4)}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(app.status)}
                        {(app.face_match_score || app.liveness_score) && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {app.face_match_score && (
                              <p>Face Match: {app.face_match_score}%</p>
                            )}
                            {app.liveness_score && (
                              <p>Liveness: {app.liveness_score}%</p>
                            )}
                          </div>
                        )}
                        {app.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteApplication(e, app.id, app.status)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
