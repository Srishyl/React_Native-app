'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Plant } from '@/types';

interface PlantDetailSectionProps {
    plant: Plant;
}

export default function PlantDetailSection({ plant }: PlantDetailSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [50, 0, 0, -50]);

    return (
        <motion.div
            ref={containerRef}
            style={{ opacity, y }}
            className="py-20 px-6 bg-gradient-to-br from-white to-botanical-50"
        >
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Plant Image */}
                    <div className="relative h-96 bg-gradient-to-br from-botanical-100 to-earth-100 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-9xl">🌱</div>
                        </div>
                    </div>

                    {/* Care Information */}
                    <div>
                        <h2 className="text-4xl md:text-5xl font-outfit font-bold text-botanical-800 mb-4">
                            {plant.name}
                        </h2>
                        <p className="text-lg text-earth-600 mb-8">
                            {plant.description}
                        </p>

                        <div className="space-y-4">
                            <CareItem icon="☀️" label="Sunlight" value={plant.care.sunlight} />
                            <CareItem icon="💧" label="Watering" value={plant.care.watering} />
                            <CareItem icon="⏱️" label="Growth Time" value={plant.care.growthTime} />
                            <CareItem icon="📍" label="Ideal Placement" value={plant.care.placement} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function CareItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
            <span className="text-3xl">{icon}</span>
            <div>
                <h4 className="font-outfit font-semibold text-botanical-700 mb-1">{label}</h4>
                <p className="text-earth-600">{value}</p>
            </div>
        </div>
    );
}
