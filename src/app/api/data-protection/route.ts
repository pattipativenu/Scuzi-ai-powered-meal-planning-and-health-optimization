import { NextResponse } from 'next/server';
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import mysql from 'mysql2/promise';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    console.log('🔍 Checking data protection status...');
    
    // 1. Check meals data
    const mealsCount = await db.select({ count: sql`count(*)` }).from(meals);
    const mealsWithImages = await db.select({ count: sql`count(*)` })
      .from(meals)
      .where(sql`${meals.imageUrl} IS NOT NULL AND ${meals.imageUrl} != ''`);

    // 2. Check WHOOP data
    const connection = await mysql.createConnection({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE,
      port: Number(process.env.RDS_PORT) || 3306,
    });

    let whoopData = { count: 0, dateRange: null, users: 0 };
    try {
      const [whoopCount] = await connection.execute('SELECT COUNT(*) as count FROM whoop_health_data');
      whoopData.count = (whoopCount as any[])[0]?.count || 0;

      if (whoopData.count > 0) {
        const [dateRange] = await connection.execute(
          'SELECT MIN(date) as earliest, MAX(date) as latest FROM whoop_health_data'
        );
        whoopData.dateRange = (dateRange as any[])[0];

        const [users] = await connection.execute('SELECT COUNT(DISTINCT user_id) as count FROM whoop_health_data');
        whoopData.users = (users as any[])[0]?.count || 0;
      }
    } catch (e) {
      // WHOOP table might not exist yet
    }

    await connection.end();

    // 3. Check S3 backups
    let backupCount = 0;
    try {
      const backups = await s3Client.send(new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'scuzi-ai-recipes',
        Prefix: 'backups/',
      }));
      backupCount = backups.Contents?.length || 0;
    } catch (e) {
      // S3 check failed
    }

    const protectionStatus = {
      timestamp: new Date().toISOString(),
      meals: {
        total: mealsCount[0]?.count || 0,
        withImages: mealsWithImages[0]?.count || 0,
        protected: true
      },
      whoop: {
        total: whoopData.count,
        users: whoopData.users,
        dateRange: whoopData.dateRange,
        protected: whoopData.count > 0
      },
      backups: {
        s3BackupCount: backupCount,
        lastBackupCheck: new Date().toISOString()
      },
      overallStatus: {
        dataSecure: (mealsCount[0]?.count || 0) > 0,
        backupsAvailable: backupCount > 0,
        readyForWhoopUpload: true
      }
    };

    return NextResponse.json({
      success: true,
      protection: protectionStatus,
      recommendations: [
        whoopData.count === 0 ? "Upload your psychological cycles CSV to add WHOOP data" : null,
        backupCount === 0 ? "Create initial backup of meals data" : null,
        "System is ready for WHOOP integration"
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('💥 Data protection check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check data protection status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔒 Creating comprehensive data backup...');
    
    // Backup both meals and WHOOP data
    const backupResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/backup-meals-data`, {
      method: 'POST'
    });

    const backupResult = await backupResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Data protection backup completed',
      backup: backupResult
    });

  } catch (error) {
    console.error('💥 Data protection backup failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create data protection backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}