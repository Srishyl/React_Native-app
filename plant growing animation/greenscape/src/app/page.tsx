'use client';

import { useState } from 'react';
import PlantGrowthAnimation from '@/components/PlantGrowthAnimation';
import ScrollTextOverlay from '@/components/ScrollTextOverlay';
import Navigation from '@/components/Navigation';
import PlantCard from '@/components/PlantCard';
import PlantDetailSection from '@/components/PlantDetailSection';
import WhyGreenScape from '@/components/WhyGreenScape';
import DeliverySection from '@/components/DeliverySection';
import Cart from '@/components/Cart';
import { useCart } from '@/hooks/useCart';
import { plants } from '@/data/plants';
import { Plant } from '@/types';

export default function Home() {
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const handleAddToCart = (plant: Plant) => {
    cart.addItem(plant);
    setIsCartOpen(true);
  };

  const handleViewDetails = (plant: Plant) => {
    setSelectedPlant(plant);
    const element = document.getElementById(`plant-detail-${plant.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="relative">
      {/* Navigation */}
      <Navigation
        cartItemCount={cart.itemCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Hero: Plant Growth Animation */}
      <div className="relative">
        <PlantGrowthAnimation />
        <ScrollTextOverlay />
      </div>

      {/* Plant Catalog Section */}
      <section id="plants" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-outfit font-bold text-botanical-800 mb-4">
              Our Plant Collection
            </h2>
            <p className="text-lg text-earth-600 max-w-2xl mx-auto">
              Carefully curated plants to transform your space into a green sanctuary.
            </p>
          </div>

          {/* Plant Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Plant Detail Sections */}
      {plants.map((plant) => (
        <div key={plant.id} id={`plant-detail-${plant.id}`}>
          <PlantDetailSection plant={plant} />
        </div>
      ))}

      {/* Why GreenScape Section */}
      <WhyGreenScape />

      {/* Delivery Section */}
      <DeliverySection />

      {/* Footer */}
      <footer className="bg-botanical-800 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-3xl font-outfit font-bold mb-4">GreenScape</h3>
          <p className="text-botanical-200 mb-6">
            Bringing nature to your doorstep, one plant at a time.
          </p>
          <div className="flex justify-center gap-8 text-sm text-botanical-300">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>
          <p className="text-botanical-400 text-sm mt-8">
            © 2026 GreenScape. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Cart */}
      <Cart
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </main>
  );
}
