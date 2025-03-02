import React from "react";
import { Heading } from "../ui/heading";
import { Subheading } from "../ui/subheading";
import { cn } from "@/lib/utils";
import { GridLineHorizontal, GridLineVertical } from "../ui/grid-lines";
import { SkeletonOne } from "../skeletons/first";
import { SkeletonTwo } from "../skeletons/second";
import { SkeletonFour } from "../skeletons/fourth";
import { SkeletonThree } from "../skeletons/third";

export const Features = () => {
  const features = [
    {
      title: "Personalizes to you",
      description:
        "Upload background information to get high-accuracy predictions.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 md:col-span-4 border-b border-r dark:border-neutral-800",
    },
    {
      title: "Works on every device",
      description:
        "Get the most accurate speaker recognition and rapid predictions.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 md:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Identify up to 10 speakers",
      description:
        "Convers recognizes different voices and identifies them.",
      skeleton: <SkeletonThree />,
      className: "col-span-1 md:col-span-3 border-r dark:border-neutral-800",
    },
    {
      title: "Talk in 50+ Languages",
      description:
        "Translate conversations in real-time.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 md:col-span-3",
    },
  ];
  return (
    <div className="relative z-20 py-10 md:py-40">
      <Heading as="h2">
        Know it before it happens
        </Heading>
      <Subheading className="text-center ">
        Your personal crystal ball
      </Subheading>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-6 mt-12">
          {features.map((feature) => {
            // Special handling for SkeletonOne
            const isSkeletonOne = feature.title === "Personalizes to you";
            
            return (
              <FeatureCard key={feature.title} className={feature.className}>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
                <div className={`w-full mx-auto ${isSkeletonOne ? 'flex justify-center items-center' : 'h-full'}`}>
                  {feature.skeleton}
                </div>
              </FeatureCard>
            );
          })}
        </div>
        <GridLineHorizontal
          style={{
            top: 0,
            left: "-10%",
            width: "120%",
          }}
        />

        <GridLineHorizontal
          style={{
            bottom: 0,
            left: "-10%",
            width: "120%",
          }}
        />

        <GridLineVertical
          style={{
            top: "-10%",
            right: 0,
            height: "120%",
          }}
        />
        <GridLineVertical
          style={{
            top: "-10%",
            left: 0,
            height: "120%",
          }}
        />
      </div>
    </div>
  );
};

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Heading as="h3" size="sm" className="text-left">
      {children}
    </Heading>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Subheading className="text-left max-w-sm mx-0 md:text-sm my-2">
      {children}
    </Subheading>
  );
};
