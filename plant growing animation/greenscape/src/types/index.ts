export interface Plant {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'indoor' | 'outdoor' | 'flowering' | 'medicinal';
    image: string;
    care: {
        sunlight: string;
        watering: string;
        growthTime: string;
        placement: string;
    };
}

export interface CartItem {
    plant: Plant;
    quantity: number;
}

export interface CartState {
    items: CartItem[];
    addItem: (plant: Plant) => void;
    removeItem: (plantId: string) => void;
    updateQuantity: (plantId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}
