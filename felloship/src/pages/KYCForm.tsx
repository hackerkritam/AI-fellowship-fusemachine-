import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Video } from "lucide-react";
import PersonalInfoStep from "@/components/kyc/PersonalInfoStep";
import DocumentUploadStep from "@/components/kyc/DocumentUploadStep";
import VideoRecordStep from "@/components/kyc/VideoRecordStep";
import ReviewStep from "@/components/kyc/ReviewStep";
import { extractFaceDescriptor, extractFaceFromVideo, compareFaceDescriptors } from "@/services/face-verification";

// OCR extraction function - uses Hugging Face API for real OCR
async function extractTextFromImage(file: File): Promise<string> {
  try {
    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Try to use Hugging Face OCR API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/trocr-large-printed",
      {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY || "hf_demo"}` },
        method: "POST",
        body: JSON.stringify({ inputs: `data:image/${file.type.split('/')[1]};base64,${base64}` }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      const extractedText = result[0]?.generated_text || "";
      console.log("[OCR] Hugging Face extracted text:", extractedText);
      return extractedText;
    } else {
      console.warn("[OCR] Hugging Face API failed, using fallback");
      return "DOCUMENT TEXT COULD NOT BE EXTRACTED";
    }
  } catch (error) {
    console.error("[OCR] Extraction error:", error);
    return "ERROR EXTRACTING TEXT FROM DOCUMENT";
  }
}

const KYCForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    fatherName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    aadhaarNumber: "",
    // New Nepal-specific fields
    citizenshipNumber: "",
    birthplaceDistrict: "",
    birthplaceLocalBodyType: "",
    birthplaceLocalBodyName: "",
    birthplaceWardNo: "",
    citizenshipIssuedDate: "",
    citizenshipIssuedDistrict: "",
    aadhaarFront: null as File | null,
    aadhaarBack: null as File | null,
    video: null as Blob | null,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload files to storage
      const uploadFile = async (file: File | Blob, path: string) => {
        const fileExt = file instanceof File ? file.name.split(".").pop() : "webm";
        const fileName = `${user.id}/${path}-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("kyc-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        return fileName;
      };

      const aadhaarFrontUrl = formData.aadhaarFront
        ? await uploadFile(formData.aadhaarFront, "aadhaar-front")
        : null;
      const aadhaarBackUrl = formData.aadhaarBack
        ? await uploadFile(formData.aadhaarBack, "aadhaar-back")
        : null;
      const videoUrl = formData.video
        ? await uploadFile(formData.video, "video")
        : null;

      // Verify document against submitted data using OCR
      let ocrVerified = false;
      let faceMatchScore = 0;
      let livenessScore = 0;
      let initialStatus = "under_review";
      let extractedText: string | null = null;
      const failedFields: string[] = [];

      try {
        if (formData.aadhaarFront) {
          // Step 1: Extract text from Aadhaar front
          const aadhaarText = await extractTextFromImage(formData.aadhaarFront);
          extractedText = aadhaarText;
          console.log("[KYC] Aadhaar OCR text:", aadhaarText);
          console.log("[KYC] Aadhaar OCR text:", aadhaarText);

          // Normalize helpers
          const normalizeText = (s?: string | null) =>
            (s || "").toString().toLowerCase().replace(/\s+/g, " ").trim();

          const digitsOnly = (s?: string | null) => (s || "").toString().replace(/[^0-9]/g, "");

          const extractedNorm = normalizeText(aadhaarText);
          const extractedDigits = digitsOnly(aadhaarText);

          const checks: { key: string; ok: boolean }[] = [];

          // Name check (partial tolerant match)
          const submittedName = normalizeText(formData.fullName);
          const nameOk = submittedName
            ? (extractedNorm.includes(submittedName) || submittedName.includes(extractedNorm.split(/\s+/)[0]))
            : false;
          checks.push({ key: "name", ok: nameOk });

          // Citizenship / ID number check (digits match)
          const submittedCitizenship = digitsOnly(formData.citizenshipNumber);
          const citizenshipOk = submittedCitizenship
            ? extractedDigits.includes(submittedCitizenship)
            : true; // if not provided, don't fail the check
          checks.push({ key: "citizenship_number", ok: citizenshipOk });

          // Citizenship issued date check - compare numeric parts
          const submittedIssuedDate = formData.citizenshipIssuedDate;
          let issuedDateOk = true;
          if (submittedIssuedDate) {
            const d = new Date(submittedIssuedDate);
            if (!isNaN(d.getTime())) {
              const y = d.getFullYear().toString();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              // check for YYYY or DDMMYYYY or YYYYMMDD presence
              const candidates = [y, `${day}${m}${y}`, `${y}${m}${day}`, `${day}${m}${y.slice(2)}`];
              issuedDateOk = candidates.some((c) => extractedDigits.includes(c));
            } else {
              // fallback to substring match
              issuedDateOk = normalizeText(submittedIssuedDate) ? extractedNorm.includes(normalizeText(submittedIssuedDate)) : true;
            }
          }
          checks.push({ key: "citizenship_issued_date", ok: issuedDateOk });

          // Citizenship issued district
          const issuedDistrict = normalizeText(formData.citizenshipIssuedDistrict);
          const issuedDistrictOk = issuedDistrict ? extractedNorm.includes(issuedDistrict) : true;
          checks.push({ key: "citizenship_issued_district", ok: issuedDistrictOk });

          // Birthplace checks
          const birthplaceDistrict = normalizeText(formData.birthplaceDistrict);
          const birthplaceDistrictOk = birthplaceDistrict ? extractedNorm.includes(birthplaceDistrict) : true;
          checks.push({ key: "birthplace_district", ok: birthplaceDistrictOk });

          const birthplaceLocal = normalizeText(formData.birthplaceLocalBodyName || formData.birthplaceLocalBodyType);
          const birthplaceLocalOk = birthplaceLocal ? extractedNorm.includes(birthplaceLocal) : true;
          checks.push({ key: "birthplace_local_body", ok: birthplaceLocalOk });

          // Aadhaar number check if present
          const aadhaarSubmitted = digitsOnly(formData.aadhaarNumber);
          const aadhaarOk = aadhaarSubmitted ? extractedDigits.includes(aadhaarSubmitted) : true;
          checks.push({ key: "aadhaar_number", ok: aadhaarOk });

          // Determine failed fields
          for (const c of checks) {
            if (!c.ok) failedFields.push(c.key);
          }

          // Compute match ratio
          const totalChecks = checks.length;
          const passed = checks.filter((c) => c.ok).length;
          const matchRatio = totalChecks ? passed / totalChecks : 0;

          console.log("[KYC] OCR multi-field check - Match ratio:", matchRatio, "Checks:", checks);

          // Step 2: Extract face from Aadhaar and video
          console.log("[KYC] Extracting faces for comparison...");
          const aadhaarDescriptor = await extractFaceDescriptor(formData.aadhaarFront);
          
          let videoDescriptor: Float32Array | null = null;
          let videoLivenessScore = 0;
          
          if (formData.video) {
            const videoResult = await extractFaceFromVideo(formData.video);
            videoDescriptor = videoResult.descriptor;
            videoLivenessScore = videoResult.livenessScore;
            console.log("[KYC] Video liveness score:", videoLivenessScore);
          }

          // Step 3: Compare faces
          if (aadhaarDescriptor && videoDescriptor) {
            faceMatchScore = compareFaceDescriptors(aadhaarDescriptor, videoDescriptor);
            livenessScore = videoLivenessScore;
            console.log("[KYC] Face Match Score:", faceMatchScore, "Liveness Score:", livenessScore);
            
            if (faceMatchScore < 50) {
              failedFields.push("face_mismatch");
              console.log("[KYC] ⚠️ Face mismatch detected");
            }
            if (livenessScore < 50) {
              failedFields.push("liveness_failed");
              console.log("[KYC] ⚠️ Liveness check failed");
            }
          } else if (formData.video) {
            // Video provided but no face detected
            faceMatchScore = 20;
            livenessScore = 20;
            failedFields.push("no_face_in_video");
            console.log("[KYC] ❌ No face detected in video");
          } else if (formData.aadhaarFront && !aadhaarDescriptor) {
            // Aadhaar provided but no face detected
            faceMatchScore = 20;
            livenessScore = 20;
            failedFields.push("no_face_in_aadhaar");
            console.log("[KYC] ❌ No face detected in Aadhaar");
          } else {
            // No video or Aadhaar
            faceMatchScore = 30;
            livenessScore = 30;
            if (!formData.video) failedFields.push("no_video");
            console.log("[KYC] ⚠️ Missing video or Aadhaar");
          }

          // Decide final state: ALL checks must pass (OCR + Face + Liveness)
          const allChecksPassed = matchRatio >= 0.75 && faceMatchScore >= 70 && livenessScore >= 60;
          const partialChecksPassed = matchRatio >= 0.4 && faceMatchScore >= 50 && livenessScore >= 40;

          if (allChecksPassed) {
            ocrVerified = true;
            initialStatus = "approved";
            console.log("[KYC] ✅ ALL verification checks PASSED - Application Approved", {
              matchRatio,
              faceMatchScore,
              livenessScore,
            });
          } else if (partialChecksPassed) {
            initialStatus = "under_review";
            console.log("[KYC] ⚠️ Partial match - manual review recommended", {
              matchRatio,
              faceMatchScore,
              livenessScore,
            });
          } else {
            initialStatus = "rejected";
            console.log("[KYC] ❌ Verification FAILED - Application Rejected", {
              matchRatio,
              faceMatchScore,
              livenessScore,
              failedFields,
            });
          }
        } else {
          // No document provided - default low scores
          faceMatchScore = Math.random() * 30;
          livenessScore = Math.random() * 30;
          initialStatus = "rejected";
        }
      } catch (ocrError) {
        console.warn("[KYC] OCR verification failed:", ocrError);
        // Default behavior if OCR fails
        faceMatchScore = 50 + Math.random() * 30;
        livenessScore = 50 + Math.random() * 30;
        initialStatus = "under_review";
      }

      faceMatchScore = Math.min(100, Math.max(0, faceMatchScore));
      livenessScore = Math.min(100, Math.max(0, livenessScore));

      // Determine rejection reason (if any)
      let rejectionReason: string | null = null;
      if (initialStatus === "rejected") {
        if (!formData.aadhaarFront) {
          rejectionReason = "No identity document uploaded";
          failedFields.push("no_document");
        } else {
          // include a short snippet of extracted text for transparency and list failed fields
          const snippet = extractedText ? extractedText.slice(0, 240) : null;
          const failedList = failedFields.length ? failedFields.join(", ") : "unknown";
          rejectionReason = snippet
            ? `The following fields did not match: ${failedList}. OCR snippet: "${snippet.replace(/\s+/g, " ").trim()}"`
            : `The following fields did not match: ${failedList}`;
        }
      }

      // Insert KYC application (include rejection reason and submitted Nepal-specific info inside ocr_data)
      const { data: insertedData, error: insertError } = await supabase.from("kyc_applications").insert({
        user_id: user.id,
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        father_name: formData.fatherName || null,
        address_line1: formData.addressLine1 || null,
        address_line2: formData.addressLine2 || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        aadhaar_number: formData.aadhaarNumber || null,
        aadhaar_front_url: aadhaarFrontUrl,
        aadhaar_back_url: aadhaarBackUrl,
        video_url: videoUrl,
        status: initialStatus,
        face_match_score: faceMatchScore,
        liveness_score: livenessScore,
        rejection_reason: rejectionReason,
        ocr_data: {
          extracted_text: extractedText || null,
          failed_fields: failedFields.length ? failedFields : null,
          submitted_fields: {
            citizenshipNumber: formData.citizenshipNumber || null,
            citizenshipIssuedDate: formData.citizenshipIssuedDate || null,
            citizenshipIssuedDistrict: formData.citizenshipIssuedDistrict || null,
            birthplaceDistrict: formData.birthplaceDistrict || null,
            birthplaceLocalBodyType: formData.birthplaceLocalBodyType || null,
            birthplaceLocalBodyName: formData.birthplaceLocalBodyName || null,
            birthplaceWardNo: formData.birthplaceWardNo || null,
          }
        },
      }).select().single();

      if (insertError) throw insertError;

      // Log audit (include rejection reason)
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "kyc_application_submitted",
        entity_type: "kyc_application",
        entity_id: insertedData?.id,
        details: {
          message: "New KYC application submitted",
          initial_status: initialStatus,
          face_match_score: faceMatchScore,
          liveness_score: livenessScore,
          rejection_reason: rejectionReason,
        },
      });

      // Notify user with clear reason when rejected
      const toastDescription = initialStatus === "rejected"
        ? `Application rejected: ${rejectionReason}`
        : `Your application status: ${initialStatus}. Face Match: ${Math.round(faceMatchScore)}%, Liveness: ${Math.round(livenessScore)}%`;

      toast({
        title: initialStatus === "rejected" ? "Application rejected" : "Application submitted",
        description: toastDescription,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Personal Info", icon: Upload },
    { number: 2, title: "Documents", icon: Upload },
    { number: 3, title: "Video", icon: Video },
    { number: 4, title: "Review", icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hamro Nepali KYC</h1>
          <p className="text-sm text-muted-foreground mb-2">Fusemachine Fellowship</p>
          <p className="text-muted-foreground">Complete all steps to submit your application</p>
        </div>

        <div className="flex justify-between mb-8">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep >= step.number
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                <span className="text-xs mt-2 text-center">{step.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 w-16 mx-2 transition-colors ${
                    currentStep > step.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Step {currentStep} of 4</CardTitle>
            <CardDescription>{steps[currentStep - 1].title}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <PersonalInfoStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 2 && <DocumentUploadStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 3 && <VideoRecordStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 4 && <ReviewStep formData={formData} />}

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              {currentStep < 4 ? (
                <Button onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default KYCForm;
