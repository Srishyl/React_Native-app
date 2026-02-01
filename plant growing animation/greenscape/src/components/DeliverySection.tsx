'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const deliverySteps = [
    {
        icon: '📦',
        title: 'Expert Packaging',
        description: 'Each plant is carefully wrapped and secured with moisture-retaining materials to protect roots and leaves during transit.',
    },
    {
        icon: '💧',
        title: 'Moisture Protection',
        description: 'We use specialized hydration packs to keep soil at optimal moisture levels throughout the journey.',
    },
    {
        icon: '🚚',
        title: 'Fast Delivery',
        description: 'Most orders arrive within 3-5 business days. Express shipping available for faster delivery.',
    },
    {
        icon: '🔄',
        title: 'Replacement Guarantee',
        description: 'If your plant arrives damaged or unhealthy, we\'ll send a replacement at no extra cost.',
    },
];

export default function DeliverySection() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section
            id="delivery"
            ref={containerRef}
            className="py-24 px-6 bg-gradient-to-br from-earth-50 via-white to-botanical-50"
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
                        Safe Delivery, Every Time
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-earth-600 max-w-2xl mx-auto"
                    >
                        Your plants\' journey from our greenhouse to your home is handled with the utmost care.
                    </motion.p>
                </div>

                {/* Delivery Steps */}
                <div className="grid md:grid-cols-2 gap-8">
                    {deliverySteps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-6 p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow"
                        >
                            <div className="text-5xl flex-shrink-0">{step.icon}</div>
                            <div>
                                <h3 className="text-2xl font-outfit font-bold text-botanical-700 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-earth-600">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-16"
                >
                    <p className="text-earth-600 mb-6">
                        Questions about delivery? We\'re here to help!
                    </p>
                    <button className="px-8 py-4 bg-botanical-500 text-white rounded-xl font-outfit font-semibold text-lg hover:bg-botanical-600 transition-colors shadow-lg hover:shadow-xl">
                        Contact Support
                    </button>
                </motion.div>
            </motion.div>
        </section>
    );
}
