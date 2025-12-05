"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

function FloatingHeart({
    className,
    width = 400,
    height = 100,
    gradient = "from-primary/[0.15]",
}: {
    className?: string;
    width?: number;
    height?: number;
    gradient?: string;
}) {
    return (
        <div className={cn("absolute", className)}>
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
        </div>
    );
}

// Dashboard version - hearts on the sides, away from top center
export function FloatingHeartsBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.08] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                <FloatingHeart
                    width={200}
                    height={200}
                    gradient="from-primary"
                    className="left-[-8%] md:left-[-5%] top-[20%]"
                />

                <FloatingHeart
                    width={160}
                    height={160}
                    gradient="from-rose-500"
                    className="right-[-5%] md:right-[0%] top-[55%]"
                />

                <FloatingHeart
                    width={120}
                    height={120}
                    gradient="from-violet-500"
                    className="left-[3%] md:left-[8%] bottom-[8%]"
                />

                <FloatingHeart
                    width={90}
                    height={90}
                    gradient="from-amber-500"
                    className="right-[5%] md:right-[10%] top-[35%]"
                />

                <FloatingHeart
                    width={70}
                    height={70}
                    gradient="from-teal-500"
                    className="right-[8%] md:right-[12%] bottom-[15%]"
                />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60 pointer-events-none" />
        </div>
    );
}

// Upload page version - hearts pushed to edges, away from center content
export function FloatingHeartsBackgroundUpload() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-background via-accent/5 to-primary/5">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.08] via-transparent to-primary/[0.08] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                {/* Top left - small */}
                <FloatingHeart
                    width={80}
                    height={80}
                    gradient="from-pink-500"
                    className="left-[2%] md:left-[5%] top-[3%]"
                />

                {/* Top right - medium */}
                <FloatingHeart
                    width={110}
                    height={110}
                    gradient="from-purple-500"
                    className="right-[5%] md:right-[8%] top-[8%]"
                />

                {/* Bottom left - large */}
                <FloatingHeart
                    width={180}
                    height={180}
                    gradient="from-blue-500"
                    className="left-[-5%] md:left-[-2%] bottom-[10%]"
                />

                {/* Bottom right - medium */}
                <FloatingHeart
                    width={130}
                    height={130}
                    gradient="from-rose-500"
                    className="right-[-3%] md:right-[2%] bottom-[20%]"
                />

                {/* Far left middle - small */}
                <FloatingHeart
                    width={70}
                    height={70}
                    gradient="from-indigo-500"
                    className="left-[0%] md:left-[3%] top-[45%]"
                />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/40 to-background/70 pointer-events-none" />
        </div>
    );
}
