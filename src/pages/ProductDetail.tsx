import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import { FaShoppingCart, FaLeaf, FaRecycle } from "react-icons/fa";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { getProductBySlug, type Product } from "@/lib/products";
import { getProductProvenance, type ProvenanceEntry } from "@/lib/traceability";
import { getMyReviewForProduct, listApprovedReviews, submitReview, type MyReview, type Review } from "@/lib/reviews";

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const ReviewsSection = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    listApprovedReviews(productId).then(({ data }) => {
      setReviews(data);
      setLoading(false);
    });
    if (user) {
      getMyReviewForProduct(productId).then(({ data }) => setMyReview(data));
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.id]);

  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Choose a star rating first");
      return;
    }
    setSubmitting(true);
    const { error } = await submitReview(productId, rating, title, body);
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit review", { description: error });
      return;
    }
    toast.success("Review submitted — it'll appear once approved");
    setRating(0);
    setTitle("");
    setBody("");
    refresh();
  };

  return (
    <div className="mt-16 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-semibold text-foreground">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(average)} size={16} />
            <span className="text-sm text-muted-foreground">
              {average.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
            </span>
          </div>
        )}
      </div>

      {!loading && reviews.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">No reviews yet — be the first.</p>
      )}

      <div className="mt-6 space-y-6">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-border pb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating value={r.rating} size={14} />
              {r.verifiedPurchase && <Badge variant="secondary">Verified purchase</Badge>}
              <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            {r.title && <p className="mt-2 font-medium text-foreground">{r.title}</p>}
            {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
            <p className="mt-1 text-xs text-muted-foreground">— {r.reviewerName}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-5 max-w-lg">
        {!user ? (
          <p className="text-sm text-muted-foreground">Sign in to leave a review.</p>
        ) : myReview ? (
          <p className="text-sm text-muted-foreground">
            {myReview.status === "pending"
              ? "Your review is awaiting approval."
              : myReview.status === "rejected"
                ? "Your review wasn't approved for publication."
                : "You've already reviewed this product — thank you!"}
          </p>
        ) : (
          <div className="space-y-3">
            <Label>Your rating</Label>
            <StarRating value={rating} onChange={setRating} size={22} />
            <div className="space-y-2">
              <Label htmlFor="review-title">Title (optional)</Label>
              <Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-body">Your review (optional)</Label>
              <Textarea id="review-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} />
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary-dark">
              {submitting ? "Submitting…" : "Submit review"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getProductBySlug(slug).then(({ data, error }) => {
      if (error) toast.error("Couldn't load this product", { description: error });
      setProduct(data);
      setLoading(false);
      if (data) {
        getProductProvenance(data.id).then(({ data: prov }) => setProvenance(prov));
      }
    });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      img: product.image_url ?? "/placeholder.svg",
      category: product.category_name,
    });
    toast.success(`Added "${product.title}" to cart`);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">It may have sold out or been removed.</p>
        <Button asChild className="mt-6 bg-primary hover:bg-primary-dark">
          <Link to="/marketplace">Back to marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${product.title} — Nyuzi`}
        description={product.description ?? `Shop ${product.title} on Nyuzi.`}
      />

      <div className="container mx-auto px-4 py-10 grid gap-10 md:grid-cols-2 max-w-5xl">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <img
            src={product.image_url ?? "/placeholder.svg"}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          {product.impact_label && (
            <span className="absolute top-4 left-4 flex items-center gap-1 bg-gold text-gold-foreground text-xs font-semibold px-3 py-1 rounded-full shadow">
              <FaLeaf /> {product.impact_label}
            </span>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{product.category_name}</div>
          <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">{product.title}</h1>
          <p className="mt-4 text-2xl font-semibold text-foreground">${product.price.toFixed(2)}</p>

          {product.description && (
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {product.stock <= 0 ? (
            <p className="mt-4 text-sm font-medium text-destructive">Out of stock</p>
          ) : product.stock <= 3 ? (
            <p className="mt-4 text-sm font-medium text-primary">Only {product.stock} left</p>
          ) : null}

          <Button
            size="lg"
            disabled={product.stock <= 0}
            onClick={handleAddToCart}
            className="mt-6 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary-dark flex items-center gap-2 disabled:opacity-50"
          >
            <FaShoppingCart /> {product.stock <= 0 ? "Sold out" : "Add to cart"}
          </Button>

          {provenance.length > 0 && (
            <div className="mt-10 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <FaRecycle className="text-primary" />
                <h2 className="font-display font-semibold text-lg text-foreground">Where this came from</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                This piece was made from {provenance.length === 1 ? "a donation" : `${provenance.length} donations`}:
              </p>
              <ul className="mt-3 space-y-2">
                {provenance.map((entry) => (
                  <li key={entry.donationId} className="text-sm text-foreground">
                    <span className="font-medium">{entry.title}</span>{" "}
                    <span className="text-muted-foreground">
                      ({entry.category}, donated {monthYear(entry.donatedAt)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <ReviewsSection productId={product.id} />
      </div>
    </div>
  );
};

export default ProductDetail;
