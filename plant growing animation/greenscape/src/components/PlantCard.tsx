'use client';

import { motion } from 'framer-motion';
import { Plant } from '@/types';

interface PlantCardProps {
    plant: Plant;
    onAddToCart: (plant: Plant) => void;
    onViewDetails: (plant: Plant) => void;
}

const categoryColors = {
    indoor: 'bg-botanical-100 text-botanical-700',
    outdoor: 'bg-blue-100 text-blue-700',
    flowering: 'bg-pink-100 text-pink-700',
    medicinal: 'bg-purple-100 text-purple-700',
};

export default function PlantCard({ plant, onAddToCart, onViewDetails }: PlantCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -8 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden group cursor-pointer transition-shadow hover:shadow-2xl"
        >
            {/* Plant Image */}
            <div className="relative h-64 bg-gradient-to-br from-botanical-50 to-earth-50 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl">🌿</div>
                </div>
                {/* Category Badge */}
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[plant.category]}`}>
                        {plant.category}
                    </span>
                </div>
            </div>

            {/* Plant Info */}
            <div className="p-6">
                <h3 className="text-2xl font-outfit font-bold text-botanical-800 mb-2">
                    {plant.name}
                </h3>
                <p className="text-earth-600 text-sm mb-4 line-clamp-2">
                    {plant.description}
                </p>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-outfit font-bold text-botanical-600">
                        ${plant.price.toFixed(2)}
                    </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => onViewDetails(plant)}
                        className="flex-1 px-4 py-3 border-2 border-botanical-500 text-botanical-700 rounded-xl font-semibold hover:bg-botanical-50 transition-colors"
                    >
                        View Details
                    </button>
                    <button
                        onClick={() => onAddToCart(plant)}
                        className="flex-1 px-4 py-3 bg-botanical-500 text-white rounded-xl font-semibold hover:bg-botanical-600 transition-colors shadow-md hover:shadow-lg"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
