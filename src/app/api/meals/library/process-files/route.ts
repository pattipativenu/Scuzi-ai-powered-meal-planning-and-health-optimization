import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    const mealsDir = join(process.cwd(), 'src', 'data', 'meals');
    
    if (action === 'list') {
      // List available files
      const files = readdirSync(mealsDir);
      return NextResponse.json({
        success: true,
        files: files.map(file => ({
          name: file,
          type: file.endsWith('.pdf') ? 'PDF' : 
                file.endsWith('.csv') ? 'CSV' : 
                file.endsWith('.json') ? 'JSON' : 'Unknown',
          path: `/src/data/meals/${file}`
        }))
      });
    }
    
    if (action === 'read') {
      const filename = searchParams.get('file');
      if (!filename) {
        return NextResponse.json({
          error: 'Filename is required',
          code: 'MISSING_FILENAME'
        }, { status: 400 });
      }
      
      const filePath = join(mealsDir, filename);
      
      try {
        if (filename.endsWith('.csv')) {
          // Read CSV file as text
          const content = readFileSync(filePath, 'utf-8');
          return NextResponse.json({
            success: true,
            filename,
            type: 'CSV',
            content,
            size: content.length,
            lines: content.split('\n').length
          });
        } else if (filename.endsWith('.json')) {
          // Read JSON file
          const content = readFileSync(filePath, 'utf-8');
          try {
            const jsonData = JSON.parse(content);
            return NextResponse.json({
              success: true,
              filename,
              type: 'JSON',
              content: jsonData,
              size: content.length,
              mealCount: Array.isArray(jsonData) ? jsonData.length : 
                        (jsonData.meals && Array.isArray(jsonData.meals)) ? jsonData.meals.length : 1
            });
          } catch (parseError) {
            return NextResponse.json({
              error: 'Invalid JSON format',
              code: 'JSON_PARSE_ERROR',
              details: parseError instanceof Error ? parseError.message : 'Unknown error'
            }, { status: 400 });
          }
        } else if (filename.endsWith('.pdf')) {
          // For PDF files, we'll need to extract text
          // For now, return file info and instructions
          const stats = require('fs').statSync(filePath);
          return NextResponse.json({
            success: true,
            filename,
            type: 'PDF',
            size: stats.size,
            message: 'PDF detected. Please copy text from PDF and use the PDF parser endpoint.',
            instructions: [
              '1. Open the PDF file',
              '2. Select all text (Ctrl+A / Cmd+A)',
              '3. Copy the text (Ctrl+C / Cmd+C)',
              '4. Use the PDF parser API endpoint with the copied text'
            ]
          });
        } else {
          return NextResponse.json({
            error: 'Unsupported file type',
            code: 'UNSUPPORTED_TYPE'
          }, { status: 400 });
        }
      } catch (fileError) {
        return NextResponse.json({
          error: 'Failed to read file',
          code: 'FILE_READ_ERROR',
          details: fileError instanceof Error ? fileError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      message: 'File Processing API',
      availableActions: {
        'list': 'GET ?action=list - List all uploaded files',
        'read': 'GET ?action=read&file=filename - Read file content'
      },
      supportedFormats: {
        'CSV': 'Comma-separated values with meal data',
        'JSON': 'JSON format with meal objects',
        'PDF': 'PDF files (manual text extraction required)'
      },
      uploadedFiles: {
        pdf1: '56 High-Protein Gut-Healthy Meals for Recovery and Energy (1).pdf',
        pdf2: 'Extract recipe details.pdf'
      },
      nextSteps: [
        '1. Use action=list to see all files',
        '2. Use action=read&file=filename to read CSV files',
        '3. For PDFs, copy text manually and use PDF parser'
      ]
    });
    
  } catch (error) {
    console.error('File processing error:', error);
    return NextResponse.json({
      error: 'Failed to process files',
      code: 'PROCESSING_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}