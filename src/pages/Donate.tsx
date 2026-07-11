import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Seo from "@/components/Seo";
import FormBanner, { type FormBannerState } from "@/components/FormBanner";
import { submitDonation } from "@/lib/submissions";
import { classifyDonationPhoto, type ClassificationSuggestion } from "@/lib/photo-classifier";
import { uploadDonationPhotos } from "@/lib/donation-photos";
import {
  FaTshirt,
  FaHandHoldingHeart,
  FaTruck,
  FaRecycle,
  FaLeaf,
} from "react-icons/fa";

const steps = [
  {
    icon: <FaTshirt className="text-3xl text-gold" />,
    title: "List Your Item",
    description: "Upload photos — an on-device scan suggests a category for you.",
  },
  {
    icon: <FaTruck className="text-3xl text-gold" />,
    title: "Schedule Pickup or Drop-off",
    description: "Choose a convenient time for us to collect your items.",
  },
  {
    icon: <FaRecycle className="text-3xl text-gold" />,
    title: "Impact & Rewards",
    description:
      "Earn points, save resources, and track your environmental impact.",
  },
];

const donationSchema = z.object({
  title: z.string().trim().min(2, "Give your item a short title"),
  category: z.enum(["clothing", "shoes", "accessories", "other"], {
    required_error: "Choose a category",
  }),
  notes: z.string().trim().optional(),
});

type DonationFormValues = z.infer<typeof donationSchema>;

const IMPACT_BASE: Record<string, { water: number; co2: number; landfill: number }> = {
  clothing: { water: 3000, co2: 3, landfill: 0.05 },
  shoes: { water: 1500, co2: 2, landfill: 0.03 },
  accessories: { water: 800, co2: 1, landfill: 0.02 },
  other: { water: 500, co2: 0.5, landfill: 0.01 },
};

const Donate = () => {
  const [condition, setCondition] = useState(70);
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [banner, setBanner] = useState<FormBannerState | null>(null);
  const [suggestion, setSuggestion] = useState<ClassificationSuggestion | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const photosRef = useRef<HTMLInputElement>(null);
  const pickupIntent = useRef(false);
  // Kept separately from `suggestion` (which clears once shown/accepted) so
  // submission can still record what the AI suggested either way.
  const lastSuggestionRef = useRef<ClassificationSuggestion | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
  });

  const photoPreviews = photos.map((file) => URL.createObjectURL(file));
  useEffect(() => {
    return () => photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotosChange = async (files: File[]) => {
    setPhotos(files);
    setSuggestion(null);
    lastSuggestionRef.current = null;
    if (files.length === 0) return;
    setClassifying(true);
    const result = await classifyDonationPhoto(files[0]);
    setClassifying(false);
    setSuggestion(result);
    lastSuggestionRef.current = result;
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    setCategory(suggestion.category);
    setValue("category", suggestion.category, { shouldValidate: true });
    setSuggestion(null);
  };

  const impact = category
    ? (() => {
        const base = IMPACT_BASE[category];
        const factor = condition / 100;
        return {
          water: Math.round(base.water * factor),
          co2: +(base.co2 * factor).toFixed(2),
          landfill: +(base.landfill * factor).toFixed(3),
        };
      })()
    : null;

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    const pickupRequested = pickupIntent.current;
    const { donationId, error } = await submitDonation({
      title: values.title,
      category: values.category,
      condition,
      notes: values.notes,
      photoCount: photos.length,
      pickupRequested,
      aiSuggestedCategory: lastSuggestionRef.current?.category,
      aiConfidence: lastSuggestionRef.current?.confidence,
    });

    if (error || !donationId) {
      setBanner({ type: "error", title: "Couldn't save your donation", description: error ?? undefined });
      toast.error("Couldn't save your donation", { description: error ?? undefined });
      return;
    }

    let photoNote = "";
    if (photos.length > 0) {
      setUploadingPhotos(true);
      const { uploaded, failed } = await uploadDonationPhotos(donationId, photos);
      setUploadingPhotos(false);
      if (failed > 0) {
        photoNote = ` ${uploaded} of ${photos.length} photo${photos.length === 1 ? "" : "s"} uploaded — the donation itself is saved either way.`;
      }
    }

    setBanner({
      type: "success",
      title: pickupRequested ? "Donation saved — pickup requested" : "Donation saved",
      description:
        "We'll follow up by email to coordinate collection; pickup scheduling is still manual for now." + photoNote,
    });
    toast.success(pickupRequested ? "Donation saved — pickup requested" : "Donation saved");

    reset();
    setCategory("");
    setCondition(70);
    setPhotos([]);
    setSuggestion(null);
    lastSuggestionRef.current = null;
    pickupIntent.current = false;
    if (photosRef.current) photosRef.current.value = "";
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark text-white">
      <Seo
        title="Donate Clothing — Nyuzi"
        description="List items, schedule pickup or drop-off, and earn rewards for circular fashion."
      />

      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center md:text-left">
          Start a Donation
        </h1>
        <p className="mt-2 text-primary-foreground/80 text-center md:text-left max-w-2xl">
          Give your clothes a second life — help the planet and earn rewards for
          contributing to a circular fashion economy.
        </p>

        {/* Steps */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="rounded-xl bg-white/10 p-6 backdrop-blur-lg text-center hover:shadow-lg transition"
            >
              <div className="flex justify-center mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">{step.description}</p>
            </div>
          ))}
        </div>

        {banner && (
          <div className="mt-10">
            <FormBanner state={banner} />
          </div>
        )}

        {/* Form */}
        <form className="mt-8 grid gap-8 md:grid-cols-3" onSubmit={onSubmit} noValidate>
          {/* Left Column */}
          <div className="space-y-6 bg-white/10 p-6 rounded-xl backdrop-blur-lg md:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="photos">Photos</Label>
              <Input
                id="photos"
                type="file"
                multiple
                accept="image/*"
                ref={photosRef}
                onChange={(e) => handlePhotosChange(Array.from(e.target.files ?? []))}
                className="bg-white text-black"
              />
              <p className="text-xs text-primary-foreground/70">
                Tip: Take clear, well-lit photos from multiple angles.
              </p>
              {classifying && (
                <p className="text-xs text-primary-foreground/70">Scanning photo on your device…</p>
              )}
              {suggestion && (
                <div className="flex items-center gap-2 rounded-md bg-gold/15 border border-gold/30 px-3 py-2 text-sm">
                  <span className="text-primary-foreground">
                    Looks like <strong className="capitalize">{suggestion.category}</strong>{" "}
                    <span className="text-primary-foreground/60">
                      ({Math.round(suggestion.confidence * 100)}% match, on-device scan)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={acceptSuggestion}
                    className="ml-auto shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-gold-foreground hover:bg-gold-dark"
                  >
                    Use this
                  </button>
                </div>
              )}
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {photoPreviews.map((url, index) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt={`Selected photo ${index + 1}`}
                        className="h-20 w-20 rounded-md object-cover border-2 border-white/40"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        aria-label={`Remove photo ${index + 1}`}
                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-gold-foreground"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Item Title</Label>
              <Input
                id="title"
                placeholder="e.g., Vintage Denim Jacket"
                className="bg-white text-black"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-gold">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(val) => {
                  setCategory(val);
                  setValue("category", val as DonationFormValues["category"], {
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-gold">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <div className="px-2">
                <Slider
                  value={[condition]}
                  max={100}
                  step={1}
                  onValueChange={(val) => setCondition(val[0])}
                />
              </div>
              <p className="text-xs text-primary-foreground/70">
                0% = heavily worn, 100% = brand new
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Brand, size, unique features"
                className="bg-white text-black"
                {...register("notes")}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => {
                  pickupIntent.current = false;
                }}
                className="bg-gold text-gold-foreground hover:bg-gold-dark w-full"
              >
                {uploadingPhotos ? "Uploading photos…" : isSubmitting ? "Saving…" : "Continue"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => {
                  pickupIntent.current = true;
                }}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-gold-foreground w-full"
              >
                {uploadingPhotos ? "Uploading photos…" : isSubmitting ? "Saving…" : "Schedule Pickup"}
              </Button>
            </div>
          </div>

          {/* Right Column - Impact Preview */}
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-lg flex flex-col items-center justify-center text-center">
            <FaLeaf className="text-5xl text-gold mb-4" />
            <h3 className="text-xl font-semibold">Estimated Impact</h3>
            {impact ? (
              <div className="mt-4 space-y-3">
                <p>
                  <span className="font-bold text-gold">
                    {impact.water}
                  </span>{" "}
                  L water saved
                </p>
                <p>
                  <span className="font-bold text-gold">{impact.co2}</span>{" "}
                  kg CO₂ avoided
                </p>
                <p>
                  <span className="font-bold text-gold">
                    {impact.landfill}
                  </span>{" "}
                  m³ landfill reduced
                </p>
              </div>
            ) : (
              <p className="text-primary-foreground/70 mt-4 text-sm">
                Select a category and condition to see your estimated impact.
              </p>
            )}
          </div>
        </form>

        {/* Impact CTA */}
        <div className="mt-12 bg-white/10 p-6 rounded-xl backdrop-blur-lg text-center">
          <FaHandHoldingHeart className="text-4xl text-gold mx-auto" />
          <h3 className="mt-4 text-xl font-semibold">
            Every Donation Makes an Impact
          </h3>
          <p className="mt-2 text-sm text-primary-foreground/80 max-w-lg mx-auto">
            By donating, you’re reducing landfill waste, saving water, and
            avoiding CO₂ emissions. Nyuzi tracks your contributions so you
            can see your positive footprint grow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Donate;
