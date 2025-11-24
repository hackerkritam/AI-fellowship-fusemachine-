import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReviewStepProps {
  formData: any;
}

const ReviewStep = ({ formData }: ReviewStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Full Name:</span>
            <span className="font-medium">{formData.fullName || "—"}</span>
            <span className="text-muted-foreground">Date of Birth:</span>
            <span className="font-medium">{formData.dateOfBirth || "—"}</span>
            <span className="text-muted-foreground">Gender:</span>
            <span className="font-medium">{formData.gender || "—"}</span>
            <span className="text-muted-foreground">Father's Name:</span>
            <span className="font-medium">{formData.fatherName || "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Address:</span>
            <span className="font-medium">
              {formData.addressLine1 && formData.city
                ? `${formData.addressLine1}, ${formData.city}, ${formData.state} ${formData.pincode}`
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Aadhaar Number:</span>
            <span className="font-medium">{formData.aadhaarNumber || "—"}</span>
            <span className="text-muted-foreground">PAN Number:</span>
            <span className="font-medium">{formData.panNumber || "—"}</span>
          </div>
          <div className="space-y-2 mt-4">
            {formData.aadhaarFront && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Aadhaar Front: {formData.aadhaarFront.name}</span>
              </div>
            )}
            {formData.aadhaarBack && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Aadhaar Back: {formData.aadhaarBack.name}</span>
              </div>
            )}
            {formData.panCard && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">PAN Card: {formData.panCard.name}</span>
              </div>
            )}
            {formData.video && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Video Recorded</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Please review all information carefully before submitting. Once submitted, the application will be reviewed by our team.
        </p>
      </div>
    </div>
  );
};

export default ReviewStep;
