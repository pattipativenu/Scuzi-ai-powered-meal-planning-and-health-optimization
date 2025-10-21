import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { db } from '@/db/mysql-connection';
import { meals, ingredients, mealIngredients, tags, mealTags } from '@/db/mysql-schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!file.name.endsWith('.csv')) {
            return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
        }

        const csvText = await file.text();

        // Parse CSV with headers
        const records = parse(csvText, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        if (records.length === 0) {
            return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
        }

        const results = {
            processed: 0,
            errors: [] as string[],
            meals: [] as any[],
        };

        // Process each meal record
        for (const [index, record] of records.entries()) {
            try {
                // Validate required fields
                const requiredFields = ['mealId', 'mealName', 'mealType'];
                const missingFields = requiredFields.filter(field => !record[field]);

                if (missingFields.length > 0) {
                    results.errors.push(`Row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`);
                    continue;
                }

                // Parse ingredients (expecting your specific JSON format)
                let ingredientsData = [];
                try {
                    if (record.ingredients) {
                        if (record.ingredients.startsWith('{')) {
                            // Your format: {"serving_size": "1 serving", "list": [...]}
                            const ingredientsObj = JSON.parse(record.ingredients);
                            ingredientsData = ingredientsObj;
                        } else if (record.ingredients.startsWith('[')) {
                            // Fallback: simple array format
                            ingredientsData = JSON.parse(record.ingredients);
                        } else {
                            // Split by comma and create simple ingredient objects
                            ingredientsData = record.ingredients.split(',').map((ing: string) => ({
                                item: ing.trim(),
                                quantity: 'as needed'
                            }));
                        }
                    }
                } catch (e) {
                    results.errors.push(`Row ${index + 2}: Invalid ingredients format`);
                    continue;
                }

                // Parse method/instructions
                let methodData = [];
                try {
                    if (record.method) {
                        if (record.method.startsWith('[')) {
                            methodData = JSON.parse(record.method);
                        } else {
                            methodData = record.method.split('.').filter(step => step.trim()).map(step => step.trim());
                        }
                    }
                } catch (e) {
                    results.errors.push(`Row ${index + 2}: Invalid method format`);
                    continue;
                }

                // Parse nutrition details (expecting your specific format)
                let nutritionData = {};
                try {
                    if (record.nutrition) {
                        if (record.nutrition.startsWith('{')) {
                            // Your format: {"serving_unit": "per 1 serving", "summary": "...", "details": {...}}
                            nutritionData = JSON.parse(record.nutrition);
                        } else {
                            // Fallback: simple format like "calories:400,protein:20g"
                            const pairs = record.nutrition.split(',');
                            nutritionData = pairs.reduce((acc: any, pair: string) => {
                                const [key, value] = pair.split(':');
                                if (key && value) {
                                    acc[key.trim()] = value.trim();
                                }
                                return acc;
                            }, {});
                        }
                    }
                } catch (e) {
                    results.errors.push(`Row ${index + 2}: Invalid nutrition format`);
                    continue;
                }

                // Parse tags
                let tagsData = [];
                try {
                    if (record.tags) {
                        if (record.tags.startsWith('[')) {
                            tagsData = JSON.parse(record.tags);
                        } else {
                            tagsData = record.tags.split(',').map((tag: string) => tag.trim());
                        }
                    }
                } catch (e) {
                    results.errors.push(`Row ${index + 2}: Invalid tags format`);
                    continue;
                }

                // Insert meal into database
                const mealData = {
                    mealId: record.meal_id || record.mealId,
                    mealName: record.meal_name || record.mealName,
                    tagline: record.tagline || null,
                    prepTime: record.prep_time || record.prepTime || null,
                    mealType: record.meal_type || record.mealType,
                    tags: tagsData,
                    servingSize: ingredientsData.serving_size || record.servingSize || '1 serving',
                    ingredients: ingredientsData,
                    method: methodData,
                    nutritionSummary: nutritionData.summary || record.nutritionSummary || null,
                    nutritionDetails: nutritionData,
                    whyThisMeal: record.why_this_meal || record.whyThisMeal || null,
                    imageUrl: null, // Will be generated later
                };

                // Check if meal already exists
                const existingMeal = await db.select().from(meals).where(eq(meals.mealId, record.mealId)).limit(1);

                let mealResult;
                if (existingMeal.length > 0) {
                    // Update existing meal
                    await db.update(meals)
                        .set({
                            ...mealData,
                            updatedAt: new Date(),
                        })
                        .where(eq(meals.mealId, record.mealId));
                    
                    // Get the updated meal
                    mealResult = await db.select().from(meals).where(eq(meals.mealId, record.mealId)).limit(1);
                } else {
                    // Insert new meal
                    await db.insert(meals).values(mealData);
                    
                    // Get the inserted meal
                    mealResult = await db.select().from(meals).where(eq(meals.mealId, record.mealId)).limit(1);
                }

                results.meals.push(mealResult[0]);
                results.processed++;

            } catch (error) {
                console.error(`Error processing row ${index + 2}:`, error);
                results.errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully processed ${results.processed} meals`,
            processed: results.processed,
            errors: results.errors,
            totalRows: records.length,
        });

    } catch (error) {
        console.error('CSV upload error:', error);
        return NextResponse.json(
            { error: 'Failed to process CSV file' },
            { status: 500 }
        );
    }
}