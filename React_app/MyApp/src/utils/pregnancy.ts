import db from '../database/db';

export interface PregnancyStats {
    currentWeek: number;
    daysRemaining: number;
    babySize: string;
}

export function calculatePregnancyStats(edd: string): PregnancyStats {
    const today = new Date();
    const eddDate = new Date(edd);

    // Default 40 weeks (280 days)
    const startDate = new Date(eddDate);
    startDate.setDate(startDate.getDate() - 280);

    const diffTime = eddDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeSinceStart = today.getTime() - startDate.getTime();
    const daysPassed = Math.floor(timeSinceStart / (1000 * 60 * 60 * 24));
    const currentWeek = Math.max(1, Math.min(40, Math.floor(daysPassed / 7)));

    let babySize = 'corn 🌽';
    if (currentWeek < 8) babySize = 'raspberry 🫐';
    else if (currentWeek < 12) babySize = 'lime 🍋';
    else if (currentWeek < 20) babySize = 'banana 🍌';
    else if (currentWeek < 25) babySize = 'corn 🌽';
    else if (currentWeek < 32) babySize = 'pineapple 🍍';
    else babySize = 'watermelon 🍉';

    return {
        currentWeek,
        daysRemaining: Math.max(0, daysRemaining),
        babySize
    };
}

export async function generateANCVisits(phone: string, startDateStr: string) {
    const startDate = new Date(startDateStr);

    // Visit 1 -> Week 12 (84 days)
    // Visit 2 -> Week 20 (140 days)
    // Visit 3 -> Week 28 (196 days)
    // Visit 4 -> Week 36 (252 days)

    const visitWeeks = [12, 20, 28, 36];

    for (let i = 0; i < visitWeeks.length; i++) {
        const visitDate = new Date(startDate);
        visitDate.setDate(visitDate.getDate() + (visitWeeks[i] * 7));
        const dateStr = visitDate.toISOString().split('T')[0];

        await db.runAsync(
            'INSERT INTO anc_visits (phone, visit_number, scheduled_date, status) VALUES (?, ?, ?, ?)',
            [phone, i + 1, dateStr, 'upcoming']
        );
    }
}

export async function seedPregnancyWeekData() {
    const weeks = [
        { week: 24, size: 'Corn 🌽', dev: 'Lungs are developing', weight: '600g', length: '30cm' },
        // Add others as needed or based on user request
    ];

    for (const w of weeks) {
        await db.runAsync(
            'INSERT OR REPLACE INTO pregnancy_week_data (week, baby_size, development, weight, length) VALUES (?, ?, ?, ?, ?)',
            [w.week, w.size, w.dev, w.weight, w.length]
        );
    }
}
