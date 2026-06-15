"use client";

/* ============================================================
   BlogPost — single-article reader. Navbar / article header /
   prose body / "more posts" / Footer.

   The post is passed in as a prop by app/blog/[slug]/page.tsx,
   which currently resolves it from the local seed (getPostBySlug).
   When the backend is live, that page swaps to fetchPost(slug) —
   this component does not change, because it only renders the
   BlogPost shape it's given.
   ============================================================ */

import { Navbar } from "@/components/sections/navbar";
import { ChatButton } from "@/components/chat-button";
import { Section } from "@/components/ui/section";
import { ImageSlot } from "@/components/ui/image-slot";
import { Icon } from "@/components/ui/icon";
import { SplitButton } from "@/components/ui/split-button";
import { Reveal, Group, Item, vFade, vRow, vCard } from "@/components/motion";
import type { BlogPost, BlogBlock } from "@/lib/blog-data";

/* renders inline <strong>/<em> coming from the data file */
function html(s: string) {
  return <span dangerouslySetInnerHTML={{ __html: s }} />;
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <Reveal as="h2" variants={vFade} className="mt-[clamp(36px,4vw,52px)] mb-4 text-[clamp(24px,2.6vw,32px)] font-bold leading-[1.12] tracking-[-0.03em] text-text-primary">
          {block.text}
        </Reveal>
      );
    case "p":
      return (
        <Reveal as="p" variants={vFade} className="m-0 mb-[22px] text-[clamp(16.5px,1.4vw,18.5px)] leading-[1.7] text-text-secondary">
          {html(block.text)}
        </Reveal>
      );
    case "ul":
      return (
        <Reveal as="ul" variants={vFade} className="m-0 mb-[22px] mt-1 flex list-none flex-col gap-3.5 p-0">
          {block.items.map((it, i) => (
            <li key={i} className="relative pl-[28px] text-[clamp(16px,1.35vw,18px)] leading-[1.6] text-text-secondary">
              <span className="absolute left-1.5 top-[11px] h-1.5 w-1.5 rounded-full bg-green opacity-90" />
              {html(it)}
            </li>
          ))}
        </Reveal>
      );
    case "quote":
      return (
        <Reveal variants={vFade} className="my-[clamp(28px,4vw,44px)] border-l-2 border-green pl-7">
          <p className="m-0 text-[clamp(20px,2.1vw,26px)] font-medium leading-[1.4] tracking-[-0.02em] text-text-primary [text-wrap:balance]">
            {block.text}
          </p>
          {block.cite && <footer className="mt-3.5 text-[14px] text-text-tertiary">— {block.cite}</footer>}
        </Reveal>
      );
    default:
      return null;
  }
}

export function BlogPostView({ post, more }: { post: BlogPost; more: BlogPost[] }) {
  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      {/* ============ ARTICLE HEADER ============ */}
      <header className="mx-auto max-w-[800px] px-[var(--gutter)] pb-[clamp(28px,4vw,44px)] pt-[clamp(120px,15vh,168px)]" data-screen-label="Article header">
        <Group stagger={0.07}>
          <Item variants={vRow} as="nav" className="mb-7 flex items-center gap-2 text-[13px] text-text-tertiary" aria-label="Breadcrumb">
            <a href="/" className="text-text-tertiary no-underline transition-colors duration-200 ease-nc hover:text-ink">Home</a>
            <Icon name="chevron-right" size={14} className="opacity-60" />
            <a href="/blog" className="text-text-tertiary no-underline transition-colors duration-200 ease-nc hover:text-ink">Blog</a>
            <Icon name="chevron-right" size={14} className="opacity-60" />
            <span className="truncate text-ink">{post.category}</span>
          </Item>
          <Item variants={vRow} as="span" className="mb-5 inline-flex w-fit items-center rounded-full bg-green-wash px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-green-dark">
            {post.category}
          </Item>
          <Item variants={vRow} as="h1" className="m-0 mb-6 text-[clamp(34px,5.2vw,58px)] font-bold leading-[1.02] tracking-[-0.045em] text-text-primary [text-wrap:balance]">
            {post.title}
          </Item>
          <Item variants={vRow} as="p" className="m-0 max-w-[60ch] text-[clamp(18px,1.7vw,22px)] leading-[1.5] text-text-secondary">
            {post.excerpt}
          </Item>
          <Item variants={vRow} className="mt-8 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[14.5px] text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[13px] font-semibold text-cream">
                {post.author.name.charAt(0)}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-semibold text-text-primary">{post.author.name}</span>
                <span className="text-[13px] text-text-tertiary">{post.author.role}</span>
              </span>
            </span>
            <span className="ml-1 text-text-tertiary">·</span>
            <span>{post.dateLabel}</span>
            <span className="text-text-tertiary">·</span>
            <span>{post.readMins} min read</span>
          </Item>
        </Group>
      </header>

      {/* ============ HERO IMAGE ============ */}
      <Reveal variants={vCard} className="mx-auto max-w-[1100px] px-[var(--gutter)]">
        <div className="relative aspect-[16/8] overflow-hidden rounded-card bg-ink max-[700px]:aspect-[16/10]">
          <ImageSlot placeholder={post.imageAlt} />
        </div>
      </Reveal>

      {/* ============ BODY ============ */}
      <article className="mx-auto max-w-[760px] px-[var(--gutter)] pt-[clamp(40px,6vw,64px)] pb-[clamp(48px,7vw,88px)]">
        {post.body.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        <Reveal variants={vFade} className="mt-[clamp(40px,6vw,64px)] flex items-center justify-between gap-4 border-t border-divider pt-8">
          <a href="/blog" className="group inline-flex items-center gap-2 text-[15px] font-semibold text-ink no-underline">
            <Icon name="arrow-left" size={18} className="transition-transform duration-200 ease-nc group-hover:-translate-x-1" />
            All posts
          </a>
          <span className="text-[14px] text-text-tertiary">{post.author.name}</span>
        </Reveal>
      </article>

      {/* ============ MORE POSTS ============ */}
      {more.length > 0 && (
        <Section id="more" label="More posts" cream>
          <Reveal as="h2" variants={vFade} className="mb-9 text-[clamp(24px,2.6vw,34px)] font-bold tracking-[-0.035em] text-text-primary">
            Keep reading
          </Reveal>
          <Group stagger={0.08} className="grid grid-cols-2 gap-[clamp(20px,2.4vw,32px)] max-[700px]:grid-cols-1">
            {more.map((p) => (
              <Item key={p.slug} variants={vCard}>
                <a
                  href={`/blog/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-card border border-border-hair bg-surface no-underline shadow-card transition-all duration-300 ease-nc hover:-translate-y-1.5 hover:shadow-lift"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-ink">
                    <div className="absolute inset-0 transition-transform duration-500 ease-nc group-hover:scale-[1.04]">
                      <ImageSlot placeholder={p.imageAlt} />
                    </div>
                    <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-cream/90 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-[clamp(20px,2.4vw,28px)]">
                    <h3 className="m-0 mb-3 text-[clamp(19px,1.6vw,22px)] font-bold leading-[1.18] tracking-[-0.025em] text-text-primary [text-wrap:balance]">
                      {p.title}
                    </h3>
                    <p className="m-0 mb-5 text-[14.5px] leading-[1.58] text-text-secondary">{p.excerpt}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 text-[13.5px] text-text-tertiary">
                      <span>{p.readMins} min read</span>
                      <Icon name="arrow-right" size={18} className="transition-all duration-200 ease-nc group-hover:translate-x-0.5 group-hover:text-ink" />
                    </div>
                  </div>
                </a>
              </Item>
            ))}
          </Group>
        </Section>
      )}

      {/* ============ CTA ============ */}
      <section className="bg-ink text-cream" data-screen-label="Blog CTA">
        <div className="mx-auto max-w-[980px] px-[var(--gutter)] py-[clamp(64px,9vw,112px)] text-center">
          <Reveal as="h2" className="m-0 text-[clamp(30px,4.4vw,56px)] font-bold leading-[1.02] tracking-[-0.045em] text-cream [text-wrap:balance]">
            Stop hoping your rent arrives. Start watching it.
          </Reveal>
          <Reveal className="mt-9 flex justify-center">
            <SplitButton href="/onboarding" variant="light" label="List your property" ariaLabel="List your property" />
          </Reveal>
        </div>
      </section>
      <ChatButton />
    </div>
  );
}
