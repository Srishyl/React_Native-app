'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NavigationProps {
    cartItemCount: number;
    onCartClick: () => void;
}

export default function Navigation({ cartItemCount, onCartClick }: NavigationProps) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${scrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Brand */}
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-2xl md:text-3xl font-outfit font-bold text-botanical-700 hover:text-botanical-600 transition-colors"
                    >
                        GreenScape
                    </button>

                    {/* Menu Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => scrollToSection('plants')}
                            className="text-earth-700 hover:text-botanical-600 font-semibold transition-colors"
                        >
                            Plants
                        </button>
                        <button
                            onClick={() => scrollToSection('why-greenscape')}
                            className="text-earth-700 hover:text-botanical-600 font-semibold transition-colors"
                        >
                            About
                        </button>
                        <button
                            onClick={() => scrollToSection('delivery')}
                            className="text-earth-700 hover:text-botanical-600 font-semibold transition-colors"
                        >
                            Delivery
                        </button>
                    </div>

                    {/* Cart Button */}
                    <button
                        onClick={onCartClick}
                        className="relative px-6 py-3 bg-botanical-500 text-white rounded-xl font-semibold hover:bg-botanical-600 transition-colors shadow-md hover:shadow-lg"
                    >
                        <span className="flex items-center gap-2">
                            <span>🛒</span>
                            <span className="hidden sm:inline">Cart</span>
                        </span>
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </motion.nav>
    );
}
