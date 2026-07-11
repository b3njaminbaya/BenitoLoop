-- Marketplace search/filter/sort/pagination currently happens entirely in
-- the browser: Marketplace.tsx fetches every published product on every
-- visit and filters/sorts client-side. That's fine at a handful of items,
-- but doesn't scale -- every visitor downloads the whole catalog even to
-- see one page of results, and there's no text search at all.
--
-- This moves filtering to the database: a trigram index on product titles
-- makes ILIKE substring search fast even as the catalog grows, without the
-- complexity of full-text search/tsvector ranking, which is overkill for a
-- boutique catalog of one-of-a-kind items.

create extension if not exists pg_trgm;

create index if not exists products_title_trgm_idx
  on public.products using gin (title gin_trgm_ops);

create index if not exists products_status_created_at_idx
  on public.products (status, created_at desc);

create index if not exists products_status_price_idx
  on public.products (status, price);
