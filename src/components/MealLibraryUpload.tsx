"use client";

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadResult {
  success: boolean;
  processed: number;
  totalRows: number;
  errors: string[];
  message: string;
}

interface ImageGenerationResult {
  success: number;
  failed: number;
  results: Array<{
    mealId: number;
    mealName: string;
    status: string;
    imageUrl?: string;
    error?: string;
  }>;
}

export function MealLibraryUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [imageResult, setImageResult] = useState<ImageGenerationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const uploadCSV = async () => {
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setImageResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/meals/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setUploadResult(result);

      if (result.success && result.processed > 0) {
        // Automatically start image generation
        await generateImages();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        processed: 0,
        totalRows: 0,
        errors: ['Failed to upload CSV file'],
        message: 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const generateImages = async () => {
    setGeneratingImages(true);
    
    try {
      const response = await fetch('/api/meals/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Generate for all meals without images
      });

      const result = await response.json();
      setImageResult(result.results);
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setGeneratingImages(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setImageResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Meal Library Upload</h2>
        <p className="text-muted-foreground">
          Upload a CSV file containing meal data. Images will be automatically generated using AWS Titan G1V2.
        </p>
      </div>

      {/* CSV Format Guide */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Required CSV Columns:</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>mealId:</strong> Unique identifier (e.g., B-0001, L-0001)</p>
          <p><strong>mealName:</strong> Name of the meal</p>
          <p><strong>mealType:</strong> Breakfast, Lunch, Dinner, Snack, or Lunch/Dinner</p>
          <p><strong>tagline:</strong> Short description (optional)</p>
          <p><strong>ingredients:</strong> JSON array or comma-separated list</p>
          <p><strong>method:</strong> JSON array or period-separated steps</p>
          <p><strong>nutritionDetails:</strong> JSON object with nutrition info</p>
          <p><strong>tags:</strong> JSON array or comma-separated tags</p>
        </div>
      </div>

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!uploadResult ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={uploadCSV}
                    disabled={uploading}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload & Generate Images'
                    )}
                  </button>
                  <button
                    onClick={() => setFile(null)}
                    className="border border-border px-4 py-2 rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg">Drop your CSV file here or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 cursor-pointer"
                >
                  Choose CSV File
                </label>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Upload Results */}
            <div className={`p-6 rounded-lg border ${
              uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                {uploadResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-semibold">Upload Results</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>Processed:</strong> {uploadResult.processed} / {uploadResult.totalRows} meals</p>
                <p><strong>Message:</strong> {uploadResult.message}</p>
                
                {uploadResult.errors.length > 0 && (
                  <div>
                    <p className="font-medium text-red-600 mb-1">Errors:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-600">
                      {uploadResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li>... and {uploadResult.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Image Generation Status */}
            {generatingImages && (
              <div className="p-6 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <h3 className="font-semibold">Generating Images with AWS Titan G1V2</h3>
                </div>
                <p className="text-sm text-blue-600">
                  Creating high-quality images for your meals. This may take a few minutes...
                </p>
              </div>
            )}

            {/* Image Generation Results */}
            {imageResult && (
              <div className="p-6 rounded-lg border bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <Image className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Image Generation Complete</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p><strong>Success:</strong> {imageResult.success} images generated</p>
                  <p><strong>Failed:</strong> {imageResult.failed} images failed</p>
                  
                  {imageResult.results.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Sample Results:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {imageResult.results.slice(0, 5).map((result, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${
                              result.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span>{result.mealName}</span>
                            {result.status === 'success' && (
                              <span className="text-green-600">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={resetUpload}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                Upload Another File
              </button>
              
              {uploadResult.success && (
                <button
                  onClick={() => window.location.href = '/plan-ahead'}
                  className="border border-border px-4 py-2 rounded-lg hover:bg-muted"
                >
                  Test Meal Generation
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}