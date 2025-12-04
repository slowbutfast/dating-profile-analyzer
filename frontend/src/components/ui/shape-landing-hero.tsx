"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";


function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-primary/[0.15]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative flex items-center justify-center"
            >
                <Heart
                    className={cn(
                        "w-full h-full",
                        gradient.replace('from-', 'text-').replace('/[0.15]', ''),
                        "fill-current opacity-15",
                        "drop-shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                    )}
                    strokeWidth={0.5}
                />
            </motion.div>
        </motion.div>
    );
}

function HeroGeometric({
    title1 = "Find Your Best Self",
    title2 = "on Dating Apps",
}: {
    title1?: string;
    title2?: string;
}) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1] as const,
            },
        }),
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.08] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                <ElegantShape
                    delay={0.3}
                    width={180}
                    height={180}
                    rotate={12}
                    gradient="from-primary"
                    className="left-[-5%] md:left-[0%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                    delay={0.5}
                    width={150}
                    height={150}
                    rotate={-15}
                    gradient="from-rose-500"
                    className="right-[0%] md:right-[5%] top-[70%] md:top-[75%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={100}
                    height={100}
                    rotate={-8}
                    gradient="from-violet-500"
                    className="left-[8%] md:left-[15%] bottom-[8%] md:bottom-[15%]"
                />

                <ElegantShape
                    delay={0.6}
                    width={80}
                    height={80}
                    rotate={20}
                    gradient="from-amber-500"
                    className="right-[18%] md:right-[25%] top-[12%] md:top-[18%]"
                />

                <ElegantShape
                    delay={0.7}
                    width={60}
                    height={60}
                    rotate={-25}
                    gradient="from-cyan-500"
                    className="left-[25%] md:left-[30%] top-[8%] md:top-[12%]"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                                {title1}
                            </span>
                            <br />
                            <span
                                className={cn(
                                    "bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-accent"
                                )}
                            >
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-2 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                            Get AI-powered insights to optimize your dating profile and make meaningful connections.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60 pointer-events-none" />
        </div>
    );
}

export { HeroGeometric }
