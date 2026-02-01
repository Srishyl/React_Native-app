'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const features = [
    {
        icon: '🌍',
        title: 'Eco Sourcing',
        description: 'All our plants are sustainably sourced from certified eco-friendly nurseries.',
    },
    {
        icon: '🏡',
        title: 'Greenhouse Grown',
        description: 'Nurtured in state-of-the-art greenhouses with optimal conditions for healthy growth.',
    },
    {
        icon: '📦',
        title: 'Safe Packaging',
        description: 'Custom protective packaging ensures your plants arrive in perfect condition.',
    },
    {
        icon: '✅',
        title: 'Live-Arrival Guarantee',
        description: 'We guarantee your plants will arrive healthy and thriving, or we\'ll replace them.',
    },
];

export default function WhyGreenScape() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section
            id="why-greenscape"
            ref={containerRef}
            className="py-24 px-6 bg-gradient-to-br from-botanical-50 via-white to-earth-50"
        >
            <motion.div style={{ opacity }} className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-outfit font-bold text-botanical-800 mb-4"
                    >
                        Why Choose GreenScape?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-earth-600 max-w-2xl mx-auto"
                    >
                        We\'re committed to bringing you the healthiest, most beautiful plants with exceptional care and service.
                    </motion.p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow"
                        >
                            <div className="text-5xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-outfit font-bold text-botanical-700 mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-earth-600">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
