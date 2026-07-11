import { supabase } from "@/lib/supabase";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

// Resized/re-encoded client-side before upload: keeps storage and bandwidth
// costs down (relevant on slower connections too), independent of whatever
// the original camera produced.
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", JPEG_QUALITY);
  });
}

export type PhotoUploadResult = {
  uploaded: number;
  failed: number;
};

export async function uploadDonationPhotos(donationId: string, files: File[]): Promise<PhotoUploadResult> {
  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const blob = await compressImage(file);
      const path = `${donationId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("donation-photos")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (uploadError) {
        failed += 1;
        continue;
      }

      const { error: rowError } = await supabase
        .from("donation_photos")
        .insert({ donation_id: donationId, storage_path: path });

      if (rowError) {
        failed += 1;
        continue;
      }

      uploaded += 1;
    } catch {
      failed += 1;
    }
  }

  return { uploaded, failed };
}

export type DonationPhoto = {
  id: string;
  storage_path: string;
};

export async function listDonationPhotos(donationId: string) {
  const { data, error } = await supabase
    .from("donation_photos")
    .select("id, storage_path")
    .eq("donation_id", donationId);
  return { data: (data as DonationPhoto[] | null) ?? [], error: error?.message ?? null };
}

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export async function getDonationPhotoUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from("donation-photos")
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);
  return { url: data?.signedUrl ?? null, error: error?.message ?? null };
}
