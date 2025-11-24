import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

interface DocumentUploadStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

const DocumentUploadStep = ({ formData, updateFormData }: DocumentUploadStepProps) => {
  const aadhaarFrontRef = useRef<HTMLInputElement>(null);
  const aadhaarBackRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (field: string, file: File | null) => {
    updateFormData({ [field]: file });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 mb-6">
        <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
        <Input
          id="aadhaarNumber"
          value={formData.aadhaarNumber}
          onChange={(e) => updateFormData({ aadhaarNumber: e.target.value })}
          placeholder="1234 5678 9012"
          maxLength={12}
        />
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Label>Aadhaar Front</Label>
            {formData.aadhaarFront && (
              <span className="text-sm text-success flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {formData.aadhaarFront.name}
              </span>
            )}
          </div>
          <input
            ref={aadhaarFrontRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("aadhaarFront", e.target.files?.[0] || null)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => aadhaarFrontRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Aadhaar Front
          </Button>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Label>Aadhaar Back</Label>
            {formData.aadhaarBack && (
              <span className="text-sm text-success flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {formData.aadhaarBack.name}
              </span>
            )}
          </div>
          <input
            ref={aadhaarBackRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange("aadhaarBack", e.target.files?.[0] || null)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => aadhaarBackRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Aadhaar Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadStep;
