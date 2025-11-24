import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSignedDocumentUrl } from "@/services/kyc-verification";

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
  face_match_score: number;
  liveness_score: number;
  status: string;
  rejection_reason: string;
  admin_notes: string;
  ocr_data?: any;
  created_at: string;
  updated_at: string;
  reviewed_at: string;
}

const ApplicationDetail = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [kyc, setKyc] = useState<KYCApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnApplication, setIsOwnApplication] = useState(false);

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

      await fetchApplicationDetails(user.id);
    } catch (error: any) {
      console.error("Auth check error:", error);
      navigate("/auth");
    }
  };

  const fetchApplicationDetails = async (userId: string) => {
    try {
      if (!applicationId) return;

      // Handle demo mode
      if (applicationId === "demo-id") {
        const demoData: KYCApplication = {
          id: "demo-id",
          user_id: userId,
          full_name: "John Doe",
          date_of_birth: "1990-01-15",
          gender: "Male",
          father_name: "Robert Doe",
          address_line1: "123 Main St",
          address_line2: "Apt 4B",
          city: "New York",
          state: "NY",
          pincode: "10001",
          aadhaar_number: "123456789012",
          pan_number: "ABCDE1234F",
          aadhaar_front_url: "",
          aadhaar_back_url: "",
          pan_card_url: "",
          video_url: "",
          face_match_score: 92.5,
          liveness_score: 87.3,
          status: "approved",
          rejection_reason: "",
          admin_notes: "✅ DEMO: All checks passed. Approved for KYC.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        };
        setKyc(demoData);
        setIsOwnApplication(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("kyc_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (error) throw error;

      // Check if application belongs to current user
      if (data.user_id !== userId) {
        navigate("/dashboard");
        return;
      }

      setKyc(data);
      setIsOwnApplication(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
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

  const getStatusDescription = (statusValue: string) => {
    const descriptions: Record<string, string> = {
      pending: "Your application is awaiting verification. This typically takes 24-48 hours.",
      under_review: "Your application is under manual review by our team.",
      approved: "Congratulations! Your KYC application has been approved.",
      rejected: "Your application was rejected. Please review the reason and resubmit if needed.",
    };
    return descriptions[statusValue] || descriptions.pending;
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
            <CardTitle>Application Not Found</CardTitle>
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Status Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Application Status</h1>
              {getStatusBadge(kyc.status)}
            </div>
          </div>

          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getStatusDescription(kyc.status)}</AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            Submitted: {new Date(kyc.created_at).toLocaleString()}
          </p>
          {kyc.reviewed_at && (
            <p className="text-sm text-muted-foreground">
              Reviewed: {new Date(kyc.reviewed_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Scores - if available */}
            {(kyc.face_match_score || kyc.liveness_score) && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Verification Results</CardTitle>
                  <CardDescription>Automated verification scores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kyc.face_match_score !== null && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Face Match Score</div>
                        <div className="text-sm font-medium">{kyc.face_match_score}%</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            kyc.face_match_score >= 80 ? "bg-green-500" : kyc.face_match_score >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${kyc.face_match_score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {kyc.liveness_score !== null && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Liveness Score</div>
                        <div className="text-sm font-medium">{kyc.liveness_score}%</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            kyc.liveness_score >= 80 ? "bg-green-500" : kyc.liveness_score >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${kyc.liveness_score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                <div className="grid grid-cols-2 gap-4 mb-4">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Summary */}
            <Card className="shadow-card sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                  {getStatusBadge(kyc.status)}
                </div>

                {kyc.rejection_reason && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Rejection Reason</p>
                    <p className="text-sm font-medium text-destructive">{kyc.rejection_reason}</p>
                  </div>
                )}

                {kyc.ocr_data?.submitted_fields && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Submitted Citizenship / Birthplace</p>
                    <div className="text-sm">
                      <p><strong>Citizenship No:</strong> {kyc.ocr_data.submitted_fields.citizenshipNumber || "-"}</p>
                      <p><strong>Issued Date:</strong> {kyc.ocr_data.submitted_fields.citizenshipIssuedDate || "-"}</p>
                      <p><strong>Issued District:</strong> {kyc.ocr_data.submitted_fields.citizenshipIssuedDistrict || "-"}</p>
                      <p><strong>Birthplace:</strong> {kyc.ocr_data.submitted_fields.birthplaceLocalBodyName || "-"} ({kyc.ocr_data.submitted_fields.birthplaceLocalBodyType || "-"}), District: {kyc.ocr_data.submitted_fields.birthplaceDistrict || "-"}, Ward: {kyc.ocr_data.submitted_fields.birthplaceWardNo || "-"}</p>
                    </div>
                  </div>
                )}

                {kyc.ocr_data?.extracted_text && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">OCR Extracted Text</p>
                    <div className="text-sm">
                      <pre className="whitespace-pre-wrap text-xs bg-muted/10 p-2 rounded">{kyc.ocr_data.extracted_text}</pre>
                    </div>
                  </div>
                )}

                {kyc.ocr_data?.failed_fields && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Failed Checks</p>
                    <div className="text-sm text-destructive">
                      {(kyc.ocr_data.failed_fields as string[]).map((f, i) => (
                        <div key={i}>- {f.replace(/_/g, ' ')}</div>
                      ))}
                    </div>
                  </div>
                )}

                {kyc.admin_notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Notes from Reviewer</p>
                    <p className="text-sm">{kyc.admin_notes}</p>
                  </div>
                )}

                {kyc.status === "rejected" && (
                  <div className="border-t pt-4">
                    <Button
                      onClick={() => navigate("/kyc-form")}
                      className="w-full"
                    >
                      Resubmit Application
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex gap-3">
                  <div className="text-muted-foreground">Submitted:</div>
                  <div className="font-medium">{new Date(kyc.created_at).toLocaleString()}</div>
                </div>
                {kyc.reviewed_at && (
                  <div className="flex gap-3">
                    <div className="text-muted-foreground">Reviewed:</div>
                    <div className="font-medium">{new Date(kyc.reviewed_at).toLocaleString()}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationDetail;
