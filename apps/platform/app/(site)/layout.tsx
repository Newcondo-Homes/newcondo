import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ChatButton } from "@/components/chat-button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatButton />
    </>
  );
}