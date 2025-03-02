import { Container } from "@/components/ui/container";
import { Background } from "@/components/ui/background";
import { Heading } from "@/components/ui/heading";
import { Subheading } from "@/components/ui/subheading";
import { Pricing } from "@/components/landing/pricing";
import { PricingTable } from "./pricing-table";
import { Companies } from "@/components/landing/companies";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Convers",
  description:
    "Predict the conversation",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};


export default function PricingPage() {
  return (
    <div className="relative overflow-hidden py-20 md:py-0">
      <Background />
      <Container className="flex flex-col items-center justify-between  pb-20">
        <div className="relative z-20 py-10 md:pt-40">
          <Heading as="h1">Simple pricing for your ease</Heading>
          <Subheading className="text-center">
            Choose a plan that works for you.
          </Subheading>
        </div>
        <Pricing />
        <PricingTable />
        <Companies />
      </Container>
    </div>
  );
}
