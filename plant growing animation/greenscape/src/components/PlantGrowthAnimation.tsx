'use client';

import { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

const TOTAL_FRAMES = 121;

export default function PlantGrowthAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });

    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

    // Preload all images
    useEffect(() => {
        const loadedImages: HTMLImageElement[] = [];
        let loadedCount = 0;

        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = `/frames/plant-growing/${i}.jpg`;

            img.onload = () => {
                loadedCount++;
                if (loadedCount === TOTAL_FRAMES) {
                    setImagesLoaded(true);
                }
            };

            img.onerror = () => {
                // Silently handle missing frames
                loadedCount++;
                if (loadedCount === TOTAL_FRAMES) {
                    setImagesLoaded(true);
                }
            };

            loadedImages[i - 1] = img;
        }

        setImages(loadedImages);
    }, []);

    // Render canvas frame
    useEffect(() => {
        if (!imagesLoaded || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const index = Math.round(frameIndex.get());
            const img = images[index];

            if (img && img.complete) {
                // Set canvas size to match container
                const container = canvas.parentElement;
                if (container) {
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;

                    // Clear canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Crop settings - cut top and bottom to focus on plant
                    const cropTop = img.height * 0.15; // Cut 15% from top
                    const cropBottom = img.height * 0.15; // Cut 15% from bottom
                    const croppedHeight = img.height - cropTop - cropBottom;

                    // Calculate scaling to fit cropped image
                    const scale = Math.min(
                        canvas.width / img.width,
                        canvas.height / croppedHeight
                    );

                    const scaledWidth = img.width * scale;
                    const scaledHeight = croppedHeight * scale;

                    const x = (canvas.width - scaledWidth) / 2;
                    const y = (canvas.height - scaledHeight) / 2;

                    // Draw cropped image
                    ctx.drawImage(
                        img,
                        0, cropTop, // Source x, y (crop from top)
                        img.width, croppedHeight, // Source width, height (cropped)
                        x, y, // Destination x, y
                        scaledWidth, scaledHeight // Destination width, height
                    );
                }
            }

            requestAnimationFrame(render);
        };

        render();
    }, [imagesLoaded, frameIndex, images]);

    return (
        <div ref={containerRef} className="relative h-[300vh]">
            {/* Sticky canvas container */}
            <div className="sticky top-0 h-screen w-full overflow-hidden bg-gradient-to-b from-botanical-50 to-earth-50">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                />

                {/* Loading indicator */}
                {!imagesLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-botanical-50">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-botanical-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-botanical-700 font-outfit text-lg">Loading growth sequence...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
