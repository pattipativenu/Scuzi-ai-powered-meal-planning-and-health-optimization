import { db } from '@/db';
import { pantryInventory } from '@/db/schema';

async function main() {
    const samplePantryItems = [
        {
            ingredientName: 'Avocado',
            quantity: 3,
            category: 'fridge',
            unit: 'pieces',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Chicken breast',
            quantity: 5,
            category: 'freezer',
            unit: 'pieces',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Greek yogurt',
            quantity: 4,
            category: 'fridge',
            unit: 'cups',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Eggs',
            quantity: 12,
            category: 'fridge',
            unit: 'pieces',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Milk',
            quantity: 2,
            category: 'fridge',
            unit: 'liters',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Cheddar cheese',
            quantity: 1,
            category: 'fridge',
            unit: 'blocks',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Butter',
            quantity: 2,
            category: 'fridge',
            unit: 'sticks',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Olive oil',
            quantity: 1,
            category: 'cupboard',
            unit: 'bottles',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Pasta',
            quantity: 3,
            category: 'cupboard',
            unit: 'boxes',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Rice',
            quantity: 2,
            category: 'cupboard',
            unit: 'bags',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Tomatoes',
            quantity: 6,
            category: 'fridge',
            unit: 'pieces',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Onions',
            quantity: 4,
            category: 'cupboard',
            unit: 'pieces',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Garlic',
            quantity: 8,
            category: 'cupboard',
            unit: 'cloves',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Bread',
            quantity: 2,
            category: 'cupboard',
            unit: 'loaves',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
        {
            ingredientName: 'Spinach',
            quantity: 1,
            category: 'fridge',
            unit: 'bunches',
            lastUpdated: new Date().toISOString(),
            userId: null,
        },
    ];

    await db.insert(pantryInventory).values(samplePantryItems);
    
    console.log('✅ Pantry inventory seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});