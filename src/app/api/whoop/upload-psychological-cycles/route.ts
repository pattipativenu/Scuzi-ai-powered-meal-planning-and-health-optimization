import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import mysql from 'mysql2/promise';

interface PsychologicalCycleRecord {
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

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Starting psychological cycles CSV upload...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    // Read CSV content
    const csvContent = await file.text();
    console.log(`📄 CSV file size: ${csvContent.length} characters`);

    // Parse CSV
    let records;
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      console.log(`📊 Parsed ${records.length} records from CSV`);
    } catch (parseError) {
      console.error('❌ CSV parsing failed:', parseError);
      return NextResponse.json({
        error: 'Failed to parse CSV file',
        details: parseError instanceof Error ? parseError.message : 'Invalid CSV format'
      }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

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

    // Process and validate records
    const processedRecords: PsychologicalCycleRecord[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      
      try {
        // Map CSV columns to database columns (flexible mapping)
        const record: PsychologicalCycleRecord = {
          user_id: row.user_id || row.userId || row.User_ID || 'default_user',
          date: row.date || row.Date || row.DATE,
          recovery_score: parseFloat(row.recovery_score || row.Recovery || row.recovery) || null,
          strain: parseFloat(row.strain || row.Strain || row.STRAIN) || null,
          sleep_hours: parseFloat(row.sleep_hours || row.Sleep || row.sleep) || null,
          calories_burned: parseInt(row.calories_burned || row.Calories || row.calories) || null,
          avg_hr: parseInt(row.avg_hr || row.AvgHR || row.avg_heart_rate) || null,
          rhr: parseInt(row.rhr || row.RHR || row.resting_heart_rate) || null,
          hrv: parseInt(row.hrv || row.HRV || row.heart_rate_variability) || null,
          spo2: parseFloat(row.spo2 || row.SpO2 || row.blood_oxygen) || null,
          skin_temp: parseFloat(row.skin_temp || row.SkinTemp || row.skin_temperature) || null,
          respiratory_rate: parseFloat(row.respiratory_rate || row.RespiratoryRate || row.breathing_rate) || null,
        };

        // Validate required fields
        if (!record.date) {
          errors.push(`Row ${i + 1}: Missing date`);
          continue;
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
          // Try to convert common date formats
          const dateObj = new Date(record.date);
          if (isNaN(dateObj.getTime())) {
            errors.push(`Row ${i + 1}: Invalid date format: ${record.date}`);
            continue;
          }
          record.date = dateObj.toISOString().split('T')[0];
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

    await connection.end();

    console.log('✅ Psychological cycles upload completed');
    
    return NextResponse.json({
      success: true,
      upload: {
        filename: file.name,
        totalRowsInCSV: records.length,
        validRecords: processedRecords.length,
        insertedRecords: insertedCount,
        updatedRecords: updatedCount,
        totalRecordsInDB: totalRecords,
        dateRange: dateRange,
        errors: errors.length > 0 ? errors.slice(0, 10) : [] // Show first 10 errors
      },
      message: `Successfully uploaded ${insertedCount} new records and updated ${updatedCount} existing records. Total WHOOP data: ${totalRecords} records.`
    });

  } catch (error) {
    console.error('💥 Psychological cycles upload failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload psychological cycles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}