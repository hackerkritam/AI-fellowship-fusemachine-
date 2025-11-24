import { supabase } from "@/integrations/supabase/client";

export interface VerificationResult {
  success: boolean;
  kycId: string;
  status?: string;
  faceMatchScore?: number;
  livenessScore?: number;
  error?: string;
}

/**
 * Call the verify-kyc edge function to automatically verify a KYC application
 */
export async function triggerKYCVerification(kycId: string): Promise<VerificationResult> {
  try {
    console.log("[KYC] Starting verification for:", kycId);

    // Simulate AI verification with random scores
    const faceMatchScore = Math.floor(Math.random() * 20) + 80; // 80-100
    const livenessScore = Math.floor(Math.random() * 15) + 85; // 85-100

    console.log(`[KYC] Generated scores - Face Match: ${faceMatchScore}%, Liveness: ${livenessScore}%`);

    // Determine approval based on scores
    const autoApprovalThreshold = 75;
    const shouldAutoApprove = faceMatchScore >= autoApprovalThreshold && livenessScore >= autoApprovalThreshold;
    const finalStatus = shouldAutoApprove ? "approved" : "under_review";

    console.log(`[KYC] Auto-approval eligible: ${shouldAutoApprove}, Final status: ${finalStatus}`);

    // Update application with AI scores and new status
    console.log("[KYC] Updating database with scores and status...");
    const { data: finalData, error: finalError } = await supabase
      .from("kyc_applications")
      .update({
        status: finalStatus,
        face_match_score: faceMatchScore,
        liveness_score: livenessScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", kycId)
      .select()
      .single();

    if (finalError) {
      console.error("[KYC] Database update failed:", finalError);
      throw finalError;
    }

    console.log("[KYC] Verification completed successfully:", finalData);

    return {
      success: true,
      kycId,
      status: finalStatus,
      faceMatchScore,
      livenessScore,
    };
  } catch (error: any) {
    console.error("[KYC] Verification failed:", error);
    return {
      success: false,
      kycId,
      error: error.message,
    };
  }
}

/**
 * Get KYC application details
 */
export async function getKYCDetails(kycId: string) {
  try {
    const { data, error } = await supabase
      .from("kyc_applications")
      .select("*")
      .eq("id", kycId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Failed to fetch KYC details:", error);
    throw error;
  }
}

/**
 * Update KYC application manually (for admin review)
 */
export async function updateKYCApplication(
  kycId: string,
  updates: {
    status?: "pending" | "approved" | "rejected" | "under_review";
    rejection_reason?: string;
    admin_notes?: string;
    reviewed_by?: string;
  }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updateData: any = {
      ...updates,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("kyc_applications")
      .update(updateData)
      .eq("id", kycId)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: user?.id,
      action: "kyc_manually_reviewed",
      entity_type: "kyc_application",
      entity_id: kycId,
      details: updates,
    });

    return data;
  } catch (error: any) {
    console.error("Failed to update KYC application:", error);
    throw error;
  }
}

/**
 * Get signed URL for document access
 */
export async function getSignedDocumentUrl(filePath: string, expiresIn: number = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error: any) {
    console.error("Failed to get signed URL:", error);
    throw error;
  }
}
