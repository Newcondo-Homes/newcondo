import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostView } from "@/components/sections/blog-post";
import {
  getPostBySlug,
  getAllSlugs,
  getAllPosts,
  /* fetchPost,  // ← swap in when the backend is ready */
} from "@/lib/blog-data";

/* ============================================================
   Dynamic blog post route — /blog/[slug]

   Currently resolves posts from the local seed (getPostBySlug).
   WHEN YOUR BACKEND IS READY:
     - replace getPostBySlug(slug) with `await fetchPost(slug)`
     - drop generateStaticParams (or have it fetch the slug list)
       and set `export const dynamic = "force-dynamic"` if you
       want every request fresh.
   ============================================================ */

// Pre-render a static page per known slug at build time.
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found | NewCondo" };
  return {
    title: `${post.title} | NewCondo Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Up to two other posts to show under "Keep reading".
  const more = getAllPosts().filter((p) => p.slug !== slug).slice(0, 2);

  return <BlogPostView post={post} more={more} />;
}
