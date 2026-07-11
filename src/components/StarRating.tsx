import { Star } from "lucide-react";

const StarRating = ({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
}) => {
  const interactive = Boolean(onChange);
  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={size}
            className={star <= value ? "fill-gold text-gold" : "text-muted-foreground"}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
