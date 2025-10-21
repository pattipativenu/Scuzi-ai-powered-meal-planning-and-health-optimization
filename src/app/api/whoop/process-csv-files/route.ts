import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ProcessedWhoopRecord {
  user_id: string;
  date: string;
  recovery_score?: number;
  strain?: number;
  sleep_hours?: number;
  calories_burned?: number;
  avg_hr?: number;
  rhr?: number;
  hrv?: number;
  spo2?: number;
  skin_temp?: number;
  respiratory_rate?: number;
}

export async function POST() {
  try {
    console.log('🚀 Processing WHOOP CSV files from codebase...');
    
    const results = {
      timestamp: new Date().toISOString(),
      files: {} as any,
      upload: {} as any
    };

    // Read both CSV files from the root directory
    const rootPath = process.cwd();
    const physiologicalPath = join(rootPath, 'physiological_cycles.csv');
    const sleepsPath = join(rootPath, 'sleeps.csv');

    // Process physiological_cycles.csv (main data)
    console.log('📊 Processing physiological_cycles.csv...');
    const physiologicalContent = readFileSync(physiologicalPath, 'utf-8');
    const physiologicalRecords = parse(physiologicalContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📊 Found ${physiologicalRecords.length} records in physiological_cycles.csv`);
    results.files.physiological_cycles = {
      records: physiologicalRecords.length,
      sample: physiologicalRecords.slice(0, 2)
    };

    // Process sleeps.csv (supplementary data)
    console.log('😴 Processing sleeps.csv...');
    const sleepsContent = readFileSync(sleepsPath, 'utf-8');
    const sleepsRecords = parse(sleepsContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`😴 Found ${sleepsRecords.length} records in sleeps.csv`);
    results.files.sleeps = {
      records: sleepsRecords.length,
      sample: sleepsRecords.slice(0, 2)
    };

    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE, // scuzi_meals
      port: Number(process.env.RDS_PORT) || 3306,
    });

    // Create whoop_health_data table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS whoop_health_data (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        date VARCHAR(20) NOT NULL,
        recovery_score INT NULL,
        strain DECIMAL(5,2) NULL,
        sleep_hours DECIMAL(4,2) NULL,
        calories_burned INT NULL,
        avg_hr INT NULL,
        rhr INT NULL,
        hrv INT NULL,
        spo2 DECIMAL(5,2) NULL,
        skin_temp DECIMAL(5,2) NULL,
        respiratory_rate DECIMAL(4,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (user_id, date)
      )
    `);

    console.log('✅ whoop_health_data table ready');

    // Process and transform physiological cycles data
    const processedRecords: ProcessedWhoopRecord[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < physiologicalRecords.length; i++) {
      const row = physiologicalRecords[i];
      
      try {
        // Extract date from "Cycle start time" (e.g., "2025-10-21 07:30:53")
        const cycleStartTime = row['Cycle start time'];
        if (!cycleStartTime) {
          errors.push(`Row ${i + 1}: Missing cycle start time`);
          continue;
        }

        const date = cycleStartTime.split(' ')[0]; // Extract YYYY-MM-DD part
        
        // Convert sleep duration from minutes to hours
        const asleepDurationMin = parseFloat(row['Asleep duration (min)']) || null;
        const sleepHours = asleepDurationMin ? (asleepDurationMin / 60) : null;

        const record: ProcessedWhoopRecord = {
          user_id: 'whoop_user_main', // Default user ID
          date: date,
          recovery_score: parseFloat(row['Recovery score %']) || null,
          strain: parseFloat(row['Day Strain']) || null,
          sleep_hours: sleepHours,
          calories_burned: parseInt(row['Energy burned (cal)']) || null,
          avg_hr: parseInt(row['Average HR (bpm)']) || null,
          rhr: parseInt(row['Resting heart rate (bpm)']) || null,
          hrv: parseInt(row['Heart rate variability (ms)']) || null,
          spo2: parseFloat(row['Blood oxygen %']) || null,
          skin_temp: parseFloat(row['Skin temp (celsius)']) || null,
          respiratory_rate: parseFloat(row['Respiratory rate (rpm)']) || null,
        };

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
          errors.push(`Row ${i + 1}: Invalid date format: ${record.date}`);
          continue;
        }

        processedRecords.push(record);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Processing error'}`);
      }
    }

    console.log(`✅ Processed ${processedRecords.length} valid records`);
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors found:`, errors.slice(0, 5));
    }

    if (processedRecords.length === 0) {
      await connection.end();
      return NextResponse.json({
        error: 'No valid records to insert',
        errors: errors
      }, { status: 400 });
    }

    // Insert records with ON DUPLICATE KEY UPDATE
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const record of processedRecords) {
      try {
        const [result] = await connection.execute(`
          INSERT INTO whoop_health_data (
            user_id, date, recovery_score, strain, sleep_hours, calories_burned,
            avg_hr, rhr, hrv, spo2, skin_temp, respiratory_rate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            recovery_score = VALUES(recovery_score),
            strain = VALUES(strain),
            sleep_hours = VALUES(sleep_hours),
            calories_burned = VALUES(calories_burned),
            avg_hr = VALUES(avg_hr),
            rhr = VALUES(rhr),
            hrv = VALUES(hrv),
            spo2 = VALUES(spo2),
            skin_temp = VALUES(skin_temp),
            respiratory_rate = VALUES(respiratory_rate),
            updated_at = CURRENT_TIMESTAMP
        `, [
          record.user_id,
          record.date,
          record.recovery_score,
          record.strain,
          record.sleep_hours,
          record.calories_burned,
          record.avg_hr,
          record.rhr,
          record.hrv,
          record.spo2,
          record.skin_temp,
          record.respiratory_rate
        ]);

        if ((result as any).affectedRows === 1) {
          insertedCount++;
        } else if ((result as any).affectedRows === 2) {
          updatedCount++;
        }
      } catch (insertError) {
        console.error('❌ Insert error:', insertError);
        errors.push(`Failed to insert record for date ${record.date}: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
      }
    }

    // Get final statistics
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM whoop_health_data');
    const totalRecords = (countResult as any[])[0]?.count || 0;

    const [dateRangeResult] = await connection.execute(
      'SELECT MIN(date) as earliest, MAX(date) as latest FROM whoop_health_data'
    );
    const dateRange = (dateRangeResult as any[])[0];

    // Calculate days of data
    let totalDays = 0;
    if (dateRange.earliest && dateRange.latest) {
      const startDate = new Date(dateRange.earliest);
      const endDate = new Date(dateRange.latest);
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    await connection.end();

    // 🔒 SECURE THE DATA - Create backup
    console.log('🔒 Creating secure backup of WHOOP data...');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'physiological_cycles.csv + sleeps.csv',
      database: 'scuzi_meals',
      table: 'whoop_health_data',
      recordCount: totalRecords,
      dateRange: dateRange,
      totalDays: totalDays,
      rawData: {
        physiological_cycles: physiologicalRecords,
        sleeps: sleepsRecords
      },
      processedData: processedRecords,
      metadata: {
        insertedRecords: insertedCount,
        updatedRecords: updatedCount,
        errors: errors,
        backupReason: 'Secure WHOOP data after CSV upload'
      }
    };

    // Save to S3 with timestamp
    const backupKey = `backups/whoop/whoop-data-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'scuzi-ai-recipes',
      Key: backupKey,
      Body: JSON.stringify(backupData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'backup-type': 'whoop-data',
        'record-count': totalRecords.toString(),
        'date-range': `${dateRange.earliest}_to_${dateRange.latest}`,
        'total-days': totalDays.toString(),
        'backup-date': new Date().toISOString()
      }
    }));

    results.upload = {
      totalRowsProcessed: physiologicalRecords.length,
      validRecords: processedRecords.length,
      insertedRecords: insertedCount,
      updatedRecords: updatedCount,
      totalRecordsInDB: totalRecords,
      dateRange: dateRange,
      totalDays: totalDays,
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
      backup: {
        s3Key: backupKey,
        secured: true
      }
    };

    console.log('✅ WHOOP data upload and backup completed');
    
    return NextResponse.json({
      success: true,
      message: `🎉 Successfully uploaded ${totalDays} days of WHOOP data! (${insertedCount} new, ${updatedCount} updated)`,
      results: results,
      summary: {
        totalDaysOfData: totalDays,
        dateRange: `${dateRange.earliest} to ${dateRange.latest}`,
        recordsInDatabase: totalRecords,
        dataSecured: true,
        readyForMealGeneration: true
      }
    });

  } catch (error) {
    console.error('💥 WHOOP CSV processing failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process WHOOP CSV files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}