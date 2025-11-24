import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getSignedDocumentUrl, updateKYCApplication } from "@/services/kyc-verification";

interface KYCApplication {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  father_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  aadhaar_number: string;
  pan_number: string;
  aadhaar_front_url: string;
  aadhaar_back_url: string;
  pan_card_url: string;
  video_url: string;
  ocr_data: any;
  face_match_score: number;
  liveness_score: number;
  status: string;
  rejection_reason: string;
  admin_notes: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

const AdminKYCReview = () => {
  const { kycId } = useParams<{ kycId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [kyc, setKyc] = useState<KYCApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const adminRole = roles?.find((r) => r.role === "admin");
      if (!adminRole) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await fetchKYCDetails();
    } catch (error: any) {
      console.error("Auth check error:", error);
      navigate("/auth");
    }
  };

  const fetchKYCDetails = async () => {
    try {
      if (!kycId) return;

      // Handle demo mode
      if (kycId === "demo-id") {
        const demoData: KYCApplication = {
          id: "demo-id",
          user_id: "demo-user-id",
          full_name: "Jane Smith",
          date_of_birth: "1992-05-20",
          gender: "Female",
          father_name: "David Smith",
          address_line1: "456 Oak Ave",
          address_line2: "Suite 200",
          city: "San Francisco",
          state: "CA",
          pincode: "94105",
          aadhaar_number: "987654321098",
          pan_number: "XYZAB5678G",
          aadhaar_front_url: "",
          aadhaar_back_url: "",
          pan_card_url: "",
          video_url: "",
          ocr_data: { status: "success", extracted_name: "JANE SMITH" },
          face_match_score: 94.8,
          liveness_score: 91.2,
          status: "under_review",
          rejection_reason: "",
          admin_notes: "Awaiting final verification",
          reviewed_by: "",
          reviewed_at: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setKyc(demoData);
        setStatus("under_review");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("kyc_applications")
        .select("*")
        .eq("id", kycId)
        .single();

      if (error) throw error;
      const row: any = data;
      setKyc(row);
      setStatus(row.status);
      setRejectionReason(row.rejection_reason || "");
      setAdminNotes(row.admin_notes || "");
      // show submitted fields in admin UI if available
      if (row.ocr_data?.submitted_fields) {
        console.log('[ADMIN] Submitted fields:', row.ocr_data.submitted_fields);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await getSignedDocumentUrl(filePath);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Error downloading document",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await updateKYCApplication(kycId!, {
        status: "approved",
        admin_notes: adminNotes,
      });

      toast({
        title: "Application Approved",
        description: "KYC application has been approved successfully",
      });

      await fetchKYCDetails();
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateKYCApplication(kycId!, {
        status: "rejected",
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      });

      toast({
        title: "Application Rejected",
        description: "KYC application has been rejected",
      });

      await fetchKYCDetails();
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      under_review: { variant: "outline", icon: Clock },
    };

    const config = variants[statusValue] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {statusValue.replace("_", " ")}
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

  if (!kyc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>KYC Application Not Found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{kyc.full_name}</h1>
            {getStatusBadge(kyc.status)}
          </div>
          <p className="text-muted-foreground">
            Submitted: {new Date(kyc.created_at).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Verification Scores */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>AI Verification Scores</CardTitle>
                <CardDescription>Automated verification results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-2">Face Match Score</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold">{kyc.face_match_score || "—"}</div>
                      <div className="text-sm text-muted-foreground">%</div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          kyc.face_match_score >= 80 ? "bg-green-500" : kyc.face_match_score >= 60 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${kyc.face_match_score || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-2">Liveness Score</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold">{kyc.liveness_score || "—"}</div>
                      <div className="text-sm text-muted-foreground">%</div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          kyc.liveness_score >= 80 ? "bg-green-500" : kyc.liveness_score >= 60 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${kyc.liveness_score || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{kyc.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{kyc.date_of_birth || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{kyc.gender || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Father's Name</p>
                    <p className="font-medium">{kyc.father_name || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address Line 1</p>
                    <p className="font-medium">{kyc.address_line1 || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address Line 2</p>
                    <p className="font-medium">{kyc.address_line2 || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{kyc.city || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">State</p>
                    <p className="font-medium">{kyc.state || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pincode</p>
                    <p className="font-medium">{kyc.pincode || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Information */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Aadhaar Number</p>
                    <p className="font-medium">••••{kyc.aadhaar_number?.slice(-4) || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PAN Number</p>
                    <p className="font-medium">{kyc.pan_number || "—"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-3">Uploaded Documents</p>
                  <div className="space-y-2">
                    {kyc.aadhaar_front_url && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => handleDownloadDocument(kyc.aadhaar_front_url, "aadhaar-front")}
                      >
                        <Download className="w-4 h-4" />
                        Aadhaar Front
                      </Button>
                    )}
                    {kyc.aadhaar_back_url && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => handleDownloadDocument(kyc.aadhaar_back_url, "aadhaar-back")}
                      >
                        <Download className="w-4 h-4" />
                        Aadhaar Back
                      </Button>
                    )}
                    {kyc.pan_card_url && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => handleDownloadDocument(kyc.pan_card_url, "pan-card")}
                      >
                        <Download className="w-4 h-4" />
                        PAN Card
                      </Button>
                    )}
                    {kyc.video_url && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => handleDownloadDocument(kyc.video_url, "liveness-video")}
                      >
                        <Download className="w-4 h-4" />
                        Liveness Video
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Review Actions */}
          <div className="space-y-6">
            <Card className="shadow-card sticky top-20">
              <CardHeader>
                <CardTitle>Review & Decision</CardTitle>
                <CardDescription>Current Status: {kyc.status}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Update */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rejection Reason */}
                {status === "rejected" && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide reason for rejection..."
                      className="min-h-20"
                    />
                  </div>
                )}

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    className="min-h-20"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t">
                  {status === "approved" ? (
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmitting || kyc.status === "approved"}
                      className="w-full gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Application
                    </Button>
                  ) : status === "rejected" ? (
                    <Button
                      onClick={handleReject}
                      disabled={isSubmitting || !rejectionReason.trim()}
                      className="w-full gap-2"
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Application
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Select a status above to take action
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Previous Review Info */}
            {kyc.reviewed_at && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Review History</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>
                    <p className="text-muted-foreground">Last Reviewed</p>
                    <p className="font-medium">{new Date(kyc.reviewed_at).toLocaleString()}</p>
                  </div>
                  {kyc.rejection_reason && (
                    <div>
                      <p className="text-muted-foreground">Rejection Reason</p>
                      <p className="font-medium">{kyc.rejection_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {status === "approved" ? "Approve Application?" : "Reject Application?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {status === "approved"
                ? "This will mark the application as approved."
                : "This will mark the application as rejected and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={status === "approved" ? handleApprove : handleReject}>
            Confirm
          </AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminKYCReview;
