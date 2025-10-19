import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whoopHealthData } from '@/db/schema';

interface WhoopHealthDataInput {
  userId: string;
  date: string;
  recoveryScore?: number;
  strain?: number;
  sleepHours?: number;
  caloriesBurned?: number;
  avgHr?: number;
  rhr?: number;
  hrv?: number;
  spo2?: number;
  skinTemp?: number;
  respiratoryRate?: number;
}

interface BulkInsertRequest {
  records: WhoopHealthDataInput[];
}

function validateRecord(record: WhoopHealthDataInput): { valid: boolean; error?: string } {
  if (!record.userId || typeof record.userId !== 'string' || record.userId.trim() === '') {
    return { valid: false, error: 'userId is required and must be a non-empty string' };
  }

  if (!record.date || typeof record.date !== 'string' || record.date.trim() === '') {
    return { valid: false, error: 'date is required and must be a non-empty string' };
  }

  // Validate date format (ISO date string)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(record.date)) {
    return { valid: false, error: 'date must be in ISO format (YYYY-MM-DD)' };
  }

  // Validate optional numeric fields
  if (record.recoveryScore !== undefined && (typeof record.recoveryScore !== 'number' || record.recoveryScore < 0 || record.recoveryScore > 100)) {
    return { valid: false, error: 'recoveryScore must be a number between 0 and 100' };
  }

  if (record.strain !== undefined && (typeof record.strain !== 'number' || record.strain < 0)) {
    return { valid: false, error: 'strain must be a non-negative number' };
  }

  if (record.sleepHours !== undefined && (typeof record.sleepHours !== 'number' || record.sleepHours < 0 || record.sleepHours > 24)) {
    return { valid: false, error: 'sleepHours must be a number between 0 and 24' };
  }

  if (record.caloriesBurned !== undefined && (typeof record.caloriesBurned !== 'number' || record.caloriesBurned < 0)) {
    return { valid: false, error: 'caloriesBurned must be a non-negative number' };
  }

  if (record.avgHr !== undefined && (typeof record.avgHr !== 'number' || record.avgHr < 0 || record.avgHr > 300)) {
    return { valid: false, error: 'avgHr must be a number between 0 and 300' };
  }

  if (record.rhr !== undefined && (typeof record.rhr !== 'number' || record.rhr < 0 || record.rhr > 300)) {
    return { valid: false, error: 'rhr must be a number between 0 and 300' };
  }

  if (record.hrv !== undefined && (typeof record.hrv !== 'number' || record.hrv < 0)) {
    return { valid: false, error: 'hrv must be a non-negative number' };
  }

  if (record.spo2 !== undefined && (typeof record.spo2 !== 'number' || record.spo2 < 0 || record.spo2 > 100)) {
    return { valid: false, error: 'spo2 must be a number between 0 and 100' };
  }

  if (record.skinTemp !== undefined && (typeof record.skinTemp !== 'number' || record.skinTemp < 30 || record.skinTemp > 45)) {
    return { valid: false, error: 'skinTemp must be a number between 30 and 45' };
  }

  if (record.respiratoryRate !== undefined && (typeof record.respiratoryRate !== 'number' || record.respiratoryRate < 0 || record.respiratoryRate > 100)) {
    return { valid: false, error: 'respiratoryRate must be a number between 0 and 100' };
  }

  return { valid: true };
}

function prepareRecord(record: WhoopHealthDataInput) {
  const timestamp = new Date().toISOString();
  
  return {
    userId: record.userId.trim(),
    date: record.date.trim(),
    recoveryScore: record.recoveryScore ?? null,
    strain: record.strain ?? null,
    sleepHours: record.sleepHours ?? null,
    caloriesBurned: record.caloriesBurned ?? null,
    avgHr: record.avgHr ?? null,
    rhr: record.rhr ?? null,
    hrv: record.hrv ?? null,
    spo2: record.spo2 ?? null,
    skinTemp: record.skinTemp ?? null,
    respiratoryRate: record.respiratoryRate ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine if this is a bulk insert or single record
    let recordsToInsert: WhoopHealthDataInput[] = [];

    if (Array.isArray(body.records)) {
      // Bulk insert
      if (body.records.length === 0) {
        return NextResponse.json(
          { error: 'records array cannot be empty', code: 'EMPTY_RECORDS_ARRAY' },
          { status: 400 }
        );
      }
      recordsToInsert = body.records;
    } else if (body.userId && body.date) {
      // Single record insert
      recordsToInsert = [body as WhoopHealthDataInput];
    } else {
      return NextResponse.json(
        { 
          error: 'Invalid request format. Expected single record with userId and date, or bulk insert with records array',
          code: 'INVALID_REQUEST_FORMAT'
        },
        { status: 400 }
      );
    }

    // Validate all records
    for (let i = 0; i < recordsToInsert.length; i++) {
      const validation = validateRecord(recordsToInsert[i]);
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: `Validation failed for record ${i + 1}: ${validation.error}`,
            code: 'VALIDATION_ERROR',
            recordIndex: i
          },
          { status: 400 }
        );
      }
    }

    // Prepare all records for insertion
    const preparedRecords = recordsToInsert.map(record => prepareRecord(record));

    // Insert records into database
    const insertedRecords = await db.insert(whoopHealthData)
      .values(preparedRecords)
      .returning();

    return NextResponse.json(
      {
        message: `Successfully created ${insertedRecords.length} record(s)`,
        data: insertedRecords
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}