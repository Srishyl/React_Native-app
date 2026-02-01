# GreenScape - Premium Online Plant Store

A production-ready Next.js e-commerce website featuring cinematic scroll-driven plant growth animation and a complete online plant shopping experience.

## 🌟 Features

- **Cinematic Scrollytelling**: Canvas-based plant growth animation with 120 frames
- **E-commerce Functionality**: Full shopping cart with add/remove/quantity management
- **Responsive Design**: Beautiful on all devices
- **Premium Aesthetics**: Botanical color palette with smooth animations
- **Static Export**: Fully exportable as static HTML

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## 📁 Project Structure

```
greenscape/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── data/            # Plant product data
│   └── types/           # TypeScript interfaces
├── public/
│   ├── frames/
│   │   └── plant-growing/  # Place 1.webp through 120.webp here
│   └── images/
│       └── plants/         # Plant product images
└── ...config files
```

## 🖼️ Adding Plant Growth Frames

To enable the scrollytelling animation, add your plant growth image sequence to:

```
public/frames/plant-growing/1.webp
public/frames/plant-growing/2.webp
...
public/frames/plant-growing/120.webp
```

The animation will gracefully handle missing frames.

## 🌱 Adding Plant Products

Edit `src/data/plants.ts` to add or modify plant products. Each plant includes:
- Name, description, price
- Category (indoor/outdoor/flowering/medicinal)
- Care information (sunlight, watering, growth time, placement)

## 🎨 Customization

### Colors

Edit `tailwind.config.ts` to customize the botanical and earth color palettes.

### Fonts

The site uses Google Fonts' Outfit. Change in `src/app/layout.tsx`.

## 📦 Build & Deploy

```bash
# Build static export
npm run build

# Output will be in the 'out/' directory
```

The `out/` directory can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## 🛠️ Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **HTML5 Canvas**

## 📝 License

MIT License - feel free to use this project for your own plant store!

---

Built with 🌿 by GreenScape
