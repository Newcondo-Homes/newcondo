"use client";

/* ============================================================
   Blog — index page. Navbar / PageHero / post grid.

   The post list is wired to render from a `posts` state. Right
   now it's seeded with REAL, hand-written posts (BLOG_POSTS via
   getAllPosts() in lib/blog-data).

   >>> WHEN YOUR BACKEND IS READY <<<
   1. Uncomment the fetchPosts() import + the useEffect below.
   2. Change the initial useState to [] (empty) instead of seed.
   3. Everything else (cards, links, empty state) is unchanged.
   The BlogPost shape is all the UI needs — return that from your
   API and nothing here changes.
   ============================================================ */

import { useState /*, useEffect */ } from "react";
import { Navbar } from "@/components/sections/navbar";
import { ChatButton } from "@/components/chat-button";
import { Section } from "@/components/ui/section";
import { ImageSlot } from "@/components/ui/image-slot";
import { Icon } from "@/components/ui/icon";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, Group, Item, vCard, vFade } from "@/components/motion";
import { getAllPosts, /* fetchPosts, */ type BlogPost } from "@/lib/blog-data";

function MetaRow({ post, onDark = false }: { post: BlogPost; onDark?: boolean }) {
  const dim = onDark ? "text-text-on-dark-2" : "text-text-tertiary";
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] ${dim}`}>
      <span>{post.author.name}</span>
      <span className="opacity-50">·</span>
      <span>{post.dateLabel}</span>
      <span className="opacity-50">·</span>
      <span>{post.readMins} min read</span>
    </div>
  );
}

export function Blog() {
  // REAL seed posts for now. Swap to useState<BlogPost[]>([]) when wiring the backend.
  const [posts] = useState<BlogPost[]>(getAllPosts());
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  /* ---- Uncomment when the backend is ready ----
  useEffect(() => {
    let alive = true;
    fetchPosts()
      .then((data) => { if (alive) setPosts(data); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  ---- */

  const [featured, ...rest] = posts;

  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      <PageHero
        label="Blog hero"
        eyebrow="Newcondo Journal"
        title={["Renting in Nigeria,", "written plainly."]}
        lead="Practical writing for property owners — how escrow protects your rent, what to ask your agent, and how to stay in control of a property from anywhere in the world."
      />

      <Section id="posts" label="Posts">
        {/* Empty / loading states for when the backend is live:
            {loading && <p className="text-text-secondary">Loading posts…</p>}
            {error && <p className="text-text-secondary">Couldn't load posts right now — please try again.</p>}
            {!loading && posts.length === 0 && <EmptyPosts />}
        */}

        {posts.length === 0 ? (
          <Reveal className="rounded-card border border-border-hair bg-surface p-[clamp(28px,4vw,48px)] text-center shadow-card">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-text-tertiary">
              <Icon name="pen-line" size={24} />
            </span>
            <h3 className="text-[22px] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2.5">No posts yet</h3>
            <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0 mx-auto max-w-[44ch]">
              We&apos;re working on the first articles. Check back soon, or follow along as we publish.
            </p>
          </Reveal>
        ) : (
          <>
            {/* ---- Featured (newest) ---- */}
            {featured && (
              <Reveal variants={vCard}>
                <a
                  href={`/blog/${featured.slug}`}
                  className="group grid grid-cols-2 overflow-hidden rounded-card border border-border-hair bg-surface no-underline shadow-card transition-all duration-300 ease-nc hover:-translate-y-1.5 hover:shadow-lift max-[860px]:grid-cols-1"
                >
                  <div className="relative aspect-[16/11] overflow-hidden bg-ink max-[860px]:aspect-[16/9]">
                    <div className="absolute inset-0 transition-transform duration-500 ease-nc group-hover:scale-[1.04]">
                      <ImageSlot placeholder={featured.imageAlt} />
                    </div>
                    <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-cream/90 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink backdrop-blur-sm">
                      {featured.category}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center p-[clamp(28px,4vw,56px)]">
                    <span className="mb-4 inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-green-dark">
                      <Icon name="star" size={14} /> Latest
                    </span>
                    <h2 className="m-0 mb-4 text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.05] tracking-[-0.035em] text-text-primary [text-wrap:balance]">
                      {featured.title}
                    </h2>
                    <p className="m-0 mb-7 max-w-[52ch] text-[clamp(15.5px,1.4vw,18px)] leading-[1.6] text-text-secondary">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <MetaRow post={featured} />
                      <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-ink text-cream transition-transform duration-200 ease-nc group-hover:translate-x-0.5">
                        <Icon name="arrow-right" size={19} />
                      </span>
                    </div>
                  </div>
                </a>
              </Reveal>
            )}

            {/* ---- Rest of the grid ---- */}
            {rest.length > 0 && (
              <Group
                stagger={0.08}
                className="mt-[clamp(28px,4vw,48px)] grid grid-cols-3 gap-[clamp(20px,2.4vw,32px)] max-[860px]:grid-cols-2 max-[600px]:grid-cols-1"
              >
                {rest.map((post) => (
                  <Item key={post.slug} variants={vCard}>
                    <a
                      href={`/blog/${post.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-card border border-border-hair bg-surface no-underline shadow-card transition-all duration-300 ease-nc hover:-translate-y-1.5 hover:shadow-lift"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                        <div className="absolute inset-0 transition-transform duration-500 ease-nc group-hover:scale-[1.04]">
                          <ImageSlot placeholder={post.imageAlt} />
                        </div>
                        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-cream/90 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink backdrop-blur-sm">
                          {post.category}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-[clamp(20px,2.4vw,28px)]">
                        <h3 className="m-0 mb-3 text-[clamp(19px,1.6vw,23px)] font-bold leading-[1.18] tracking-[-0.025em] text-text-primary [text-wrap:balance]">
                          {post.title}
                        </h3>
                        <p className="m-0 mb-6 text-[14.5px] leading-[1.58] text-text-secondary">
                          {post.excerpt}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-divider pt-4">
                          <MetaRow post={post} />
                          <Icon
                            name="arrow-right"
                            size={18}
                            className="flex-none text-text-tertiary transition-all duration-200 ease-nc group-hover:translate-x-0.5 group-hover:text-ink"
                          />
                        </div>
                      </div>
                    </a>
                  </Item>
                ))}
              </Group>
            )}
          </>
        )}

        <Reveal variants={vFade} className="mt-[clamp(40px,6vw,72px)] flex items-center gap-3 rounded-[16px] bg-surface-sunken px-6 py-5 text-[14.5px] text-text-secondary">
          <Icon name="mail" size={19} className="flex-none text-text-tertiary" />
          <span>
            New articles land here as we publish. Questions for the team?{" "}
            <a href="/support" className="font-semibold text-green-dark underline underline-offset-[3px]">Talk to us</a>.
          </span>
        </Reveal>
      </Section>
      <ChatButton />
    </div>
  );
}
