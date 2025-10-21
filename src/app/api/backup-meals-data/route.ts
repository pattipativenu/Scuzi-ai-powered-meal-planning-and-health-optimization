import { NextResponse } from 'next/server';
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST() {
  try {
    console.log('🔒 Starting meals data backup...');
    
    // 1. Export all meals data
    const allMeals = await db.select().from(meals);
    console.log(`📊 Found ${allMeals.length} meals to backup`);

    // 2. Create comprehensive backup data
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      database: 'scuzi_meals',
      table: 'meals',
      recordCount: allMeals.length,
      data: allMeals,
      metadata: {
        mealTypes: [...new Set(allMeals.map(m => m.mealType))],
        mealsWithImages: allMeals.filter(m => m.imageUrl && m.imageUrl.trim()).length,
        totalTags: [...new Set(allMeals.flatMap(m => m.tags || []))].length,
        backupReason: 'Data protection before WHOOP integration'
      }
    };

    // 3. Save to S3 with timestamp
    const backupKey = `backups/meals/meals-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'scuzi-ai-recipes',
      Key: backupKey,
      Body: JSON.stringify(backupData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'backup-type': 'meals-data',
        'record-count': allMeals.length.toString(),
        'backup-date': new Date().toISOString()
      }
    }));

    // 4. Also save locally as JSON file for immediate access
    const fs = require('fs').promises;
    const path = require('path');
    
    const backupDir = path.join(process.cwd(), 'backups');
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    const localBackupPath = path.join(backupDir, `meals-backup-${Date.now()}.json`);
    await fs.writeFile(localBackupPath, JSON.stringify(backupData, null, 2));

    console.log('✅ Meals data backup completed');
    
    return NextResponse.json({
      success: true,
      backup: {
        s3Key: backupKey,
        localPath: localBackupPath,
        recordCount: allMeals.length,
        timestamp: backupData.timestamp,
        mealsWithImages: backupData.metadata.mealsWithImages,
        mealTypes: backupData.metadata.mealTypes
      },
      message: `Successfully backed up ${allMeals.length} meals to S3 and local storage`
    });

  } catch (error) {
    console.error('💥 Meals backup failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to backup meals data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}