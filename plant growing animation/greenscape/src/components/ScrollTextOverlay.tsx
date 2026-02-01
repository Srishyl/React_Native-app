'use client';

import { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

const storyBeats = [
    { text: 'From seed…', range: [0, 0.25] },
    { text: 'to root…', range: [0.25, 0.5] },
    { text: 'to life…', range: [0.5, 0.75] },
    { text: 'welcome to GreenScape.', range: [0.75, 1] },
];

export default function ScrollTextOverlay() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });

    return (
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-10">
            <div className="h-[300vh]">
                {storyBeats.map((beat, index) => {
                    const opacity = useTransform(
                        scrollYProgress,
                        [
                            beat.range[0],
                            beat.range[0] + 0.05,
                            beat.range[1] - 0.05,
                            beat.range[1],
                        ],
                        [0, 1, 1, 0]
                    );

                    return (
                        <motion.div
                            key={index}
                            style={{ opacity }}
                            className="sticky top-0 h-screen flex items-center justify-center"
                        >
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-outfit font-bold text-botanical-800 text-center px-4">
                                {beat.text}
                            </h1>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
