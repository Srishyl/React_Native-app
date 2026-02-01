'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CartState } from '@/types';

interface CartProps {
    cart: CartState;
    isOpen: boolean;
    onClose: () => void;
}

export default function Cart({ cart, isOpen, onClose }: CartProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Cart Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-earth-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-outfit font-bold text-botanical-800">
                                    Your Cart
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-earth-500 hover:text-earth-700 text-3xl leading-none"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="text-sm text-earth-600 mt-1">
                                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
                            </p>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {cart.items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="text-6xl mb-4">🌿</div>
                                    <p className="text-earth-600">Your cart is empty</p>
                                    <p className="text-sm text-earth-500 mt-2">Add some plants to get started!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.items.map((item) => (
                                        <div
                                            key={item.plant.id}
                                            className="flex gap-4 p-4 bg-botanical-50 rounded-xl"
                                        >
                                            {/* Plant Image */}
                                            <div className="w-20 h-20 bg-gradient-to-br from-botanical-100 to-earth-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-3xl">🌱</span>
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-outfit font-semibold text-botanical-800 truncate">
                                                    {item.plant.name}
                                                </h3>
                                                <p className="text-botanical-600 font-semibold">
                                                    ${item.plant.price.toFixed(2)}
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        onClick={() => cart.updateQuantity(item.plant.id, item.quantity - 1)}
                                                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-botanical-700 hover:bg-botanical-100 font-semibold"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center font-semibold text-botanical-800">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => cart.updateQuantity(item.plant.id, item.quantity + 1)}
                                                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-botanical-700 hover:bg-botanical-100 font-semibold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => cart.removeItem(item.plant.id)}
                                                className="text-earth-400 hover:text-red-500 text-xl"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cart.items.length > 0 && (
                            <div className="p-6 border-t border-earth-200 bg-botanical-50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-outfit font-semibold text-botanical-800">
                                        Total
                                    </span>
                                    <span className="text-2xl font-outfit font-bold text-botanical-600">
                                        ${cart.total.toFixed(2)}
                                    </span>
                                </div>
                                <button className="w-full py-4 bg-botanical-500 text-white rounded-xl font-outfit font-semibold text-lg hover:bg-botanical-600 transition-colors shadow-lg hover:shadow-xl">
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
