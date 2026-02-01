'use client';

import { useState, useMemo } from 'react';
import { Plant, CartItem, CartState } from '@/types';

export function useCart(): CartState {
    const [items, setItems] = useState<CartItem[]>([]);

    const addItem = (plant: Plant) => {
        setItems((currentItems) => {
            const existingItem = currentItems.find((item) => item.plant.id === plant.id);

            if (existingItem) {
                return currentItems.map((item) =>
                    item.plant.id === plant.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...currentItems, { plant, quantity: 1 }];
        });
    };

    const removeItem = (plantId: string) => {
        setItems((currentItems) =>
            currentItems.filter((item) => item.plant.id !== plantId)
        );
    };

    const updateQuantity = (plantId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(plantId);
            return;
        }

        setItems((currentItems) =>
            currentItems.map((item) =>
                item.plant.id === plantId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const total = useMemo(
        () =>
            items.reduce((sum, item) => sum + item.plant.price * item.quantity, 0),
        [items]
    );

    const itemCount = useMemo(
        () => items.reduce((count, item) => count + item.quantity, 0),
        [items]
    );

    return {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
    };
}
