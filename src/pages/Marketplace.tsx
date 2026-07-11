import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FaShoppingCart, FaLeaf, FaSearch } from "react-icons/fa";
import { useCart } from "@/lib/cart-context";
import { listPublishedProducts, type Product, type ProductSort } from "@/lib/products";
import { listCategories, type Category } from "@/lib/categories";

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<ProductSort>("newest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { addItem } = useCart();

  // Filter changes can fire fetches in quick succession (e.g. setting min
  // then max price back to back). Without this, a slower earlier response
  // can resolve after a newer one and overwrite it with stale results --
  // this guard makes sure only the most recently *requested* fetch is ever
  // applied to state, regardless of response order.
  const requestIdRef = useRef(0);

  useEffect(() => {
    listCategories().then(({ data }) => setCategories(data));
  }, []);

  // Debounce the free-text search so we don't fire a query on every
  // keystroke -- filters below react to `search`, not `searchInput`.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters = {
    search: search || undefined,
    categoryId: selectedCategoryId,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy,
  };
  const filterKey = JSON.stringify(filters);

  // Any filter change resets to page 0 and replaces the result set.
  useEffect(() => {
    setLoading(true);
    setLoadingMore(false);
    setPage(0);
    const requestId = ++requestIdRef.current;
    listPublishedProducts({ ...filters, page: 0, pageSize: PAGE_SIZE }).then(({ data, count, error }) => {
      if (requestId !== requestIdRef.current) return; // a newer request has since superseded this one
      if (error) toast.error("Couldn't load the marketplace", { description: error });
      setProducts(data);
      setTotalCount(count);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loadMore = async () => {
    const nextPage = page + 1;
    const requestId = ++requestIdRef.current;
    setLoadingMore(true);
    const { data, count, error } = await listPublishedProducts({ ...filters, page: nextPage, pageSize: PAGE_SIZE });
    if (requestId !== requestIdRef.current) return; // filters changed while this was in flight
    if (error) toast.error("Couldn't load more products", { description: error });
    setProducts((prev) => [...prev, ...data]);
    setTotalCount(count);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      img: product.image_url ?? "/placeholder.svg",
      category: product.category_name,
    });
    toast.success(`Added "${product.title}" to cart`);
  };

  const hasMore = products.length < totalCount;
  const hasActiveFilters = Boolean(search || selectedCategoryId || minPrice || maxPrice);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Marketplace — Nyuzi"
        description="Shop unique upcycled products with transparent impact."
      />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-semibold text-center md:text-left">
          Marketplace
        </h1>
        <p className="mt-2 text-muted-foreground text-center md:text-left max-w-2xl">
          Discover one-of-a-kind pieces crafted from reclaimed materials — shop,
          support, and make an impact.
        </p>

        {/* Search */}
        <div className="mt-8 relative max-w-md mx-auto md:mx-0">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>

        {/* Filters and Sort */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <button
              onClick={() => setSelectedCategoryId(undefined)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!selectedCategoryId
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground hover:border-primary hover:text-primary"
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-20 h-9"
                aria-label="Minimum price"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-20 h-9"
                aria-label="Maximum price"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProductSort)}
              className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              aria-label="Sort products"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="mt-12 text-center text-muted-foreground">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">
            {hasActiveFilters
              ? "No products match your search — try adjusting your filters."
              : "No products are live yet — check back soon."}
          </p>
        ) : (
          <>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="group rounded-lg overflow-hidden border border-border bg-card shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <Link to={`/product/${p.slug}`} className="relative w-full aspect-square overflow-hidden bg-muted block">
                    <img
                      src={p.image_url ?? "/placeholder.svg"}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {p.impact_label && (
                      <span className="absolute top-3 left-3 flex items-center gap-1 bg-gold text-gold-foreground text-xs font-semibold px-3 py-1 rounded-full shadow">
                        <FaLeaf /> {p.impact_label}
                      </span>
                    )}
                  </Link>
                  <div className="p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{p.category_name}</div>
                    <h3 className="mt-1 font-display font-semibold text-lg text-foreground">
                      <Link to={`/product/${p.slug}`} className="hover:text-primary transition-colors">
                        {p.title}
                      </Link>
                    </h3>
                    {p.stock <= 0 ? (
                      <p className="mt-1 text-xs font-medium text-destructive">Out of stock</p>
                    ) : p.stock <= 3 ? (
                      <p className="mt-1 text-xs font-medium text-primary">Only {p.stock} left</p>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground">
                        ${p.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        disabled={p.stock <= 0}
                        onClick={() => handleAddToCart(p)}
                        className="bg-primary text-primary-foreground hover:bg-primary-dark flex items-center gap-2 disabled:opacity-50"
                      >
                        <FaShoppingCart /> {p.stock <= 0 ? "Sold out" : "Add to cart"}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="min-w-40"
                >
                  {loadingMore ? "Loading…" : `Load more (${totalCount - products.length} left)`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
