"use client";

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Database } from 'lucide-react';

export default function UploadWhoopDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/whoop/upload-psychological-cycles', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        console.log('✅ Upload successful:', data);
      } else {
        setError(data.error || 'Upload failed');
        console.error('❌ Upload failed:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('❌ Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Database className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload WHOOP Psychological Cycles
            </h1>
            <p className="text-gray-600">
              Upload your psychological_cycles.csv file to restore your WHOOP health data
            </p>
          </div>

          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <span className="text-lg font-medium text-gray-700 mb-2">
                Choose CSV File
              </span>
              <span className="text-sm text-gray-500">
                Select your psychological_cycles.csv file
              </span>
            </label>
          </div>

          {/* Selected File Info */}
          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">{file.name}</p>
                  <p className="text-sm text-blue-700">
                    Size: {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="text-center mb-6">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload WHOOP Data
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-900">Upload Failed</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-medium text-green-900">
                  Upload Successful!
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-green-800">Records Processed:</p>
                  <p className="text-green-700">
                    {result.upload.validRecords} valid records from {result.upload.totalRowsInCSV} CSV rows
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-green-800">Database Updates:</p>
                  <p className="text-green-700">
                    {result.upload.insertedRecords} new, {result.upload.updatedRecords} updated
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-green-800">Total WHOOP Data:</p>
                  <p className="text-green-700">
                    {result.upload.totalRecordsInDB} records in database
                  </p>
                </div>
                
                {result.upload.dateRange && (
                  <div>
                    <p className="font-medium text-green-800">Date Range:</p>
                    <p className="text-green-700">
                      {result.upload.dateRange.earliest} to {result.upload.dateRange.latest}
                    </p>
                  </div>
                )}
              </div>

              {result.upload.errors && result.upload.errors.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-medium text-yellow-800 mb-2">
                    Warnings ({result.upload.errors.length}):
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {result.upload.errors.slice(0, 5).map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {result.upload.errors.length > 5 && (
                      <li>• ... and {result.upload.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-green-800 font-medium">
                  🎉 Your WHOOP data is now ready for intelligent meal generation!
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              CSV Format Requirements
            </h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Required columns:</strong> date (YYYY-MM-DD format)</p>
              <p><strong>Optional columns:</strong> recovery_score, strain, sleep_hours, calories_burned, avg_hr, rhr, hrv, spo2, skin_temp, respiratory_rate</p>
              <p><strong>User ID:</strong> Will default to 'default_user' if not provided</p>
              <p><strong>Note:</strong> Duplicate dates will be updated with new values</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}