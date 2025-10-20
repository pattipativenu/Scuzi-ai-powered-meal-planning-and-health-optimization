'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Upload, Image, Database } from 'lucide-react';

export default function BulkUploadPage() {
  const [csvContent, setCsvContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [generateImages, setGenerateImages] = useState(true);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvContent.trim()) {
      alert('Please upload a CSV file or paste CSV content');
      return;
    }

    setIsUploading(true);
    setResults(null);

    try {
      const response = await fetch('/api/meals/library/bulk-upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvText: csvContent,
          generateImages: generateImages
        }),
      });

      const data = await response.json();
      setResults(data);

      if (data.success) {
        // Clear the form on success
        setCsvContent('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResults({
        success: false,
        error: 'Failed to upload meals',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Meal Upload</h1>
        <p className="text-gray-600">Upload CSV files with meal data and automatically generate images</p>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Upload your CSV file containing meal data. Images will be automatically generated using AWS Titan G1V2.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div>
              <label htmlFor="csv-file" className="block text-sm font-medium mb-2">
                Choose CSV File
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* CSV Content Preview */}
            <div>
              <label htmlFor="csv-content" className="block text-sm font-medium mb-2">
                CSV Content Preview
              </label>
              <Textarea
                id="csv-content"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="CSV content will appear here, or you can paste it directly..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {/* Options */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="generate-images"
                checked={generateImages}
                onChange={(e) => setGenerateImages(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="generate-images" className="text-sm font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Generate images automatically (AWS Titan G1V2)
              </label>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleBulkUpload}
              disabled={isUploading || !csvContent.trim()}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading & Generating Images...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Upload {csvContent ? `${csvContent.split('\n').length - 1} meals` : 'Meals'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Upload Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {results.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {results.error}: {results.details}
                  </AlertDescription>
                </Alert>
              )}

              {/* Statistics */}
              {results.results && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{results.results.totalMeals}</div>
                    <div className="text-sm text-blue-600">Total Meals</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{results.results.successful}</div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{results.results.imagesGenerated}</div>
                    <div className="text-sm text-purple-600">Images Generated</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{results.results.failed}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>
              )}

              {/* Success Rate */}
              {results.results && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Success Rate</span>
                    <span>{Math.round((results.results.successful / results.results.totalMeals) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(results.results.successful / results.results.totalMeals) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Successful Meals */}
              {results.meals && results.meals.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Successfully Uploaded Meals:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.meals.map((meal: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{meal.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {meal.mealType}
                          </span>
                          {meal.hasImage && (
                            <Image className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {results.errors && results.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((error: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-red-50 rounded text-red-700">
                        <strong>{error.name}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Required columns:</strong> name, meal_type, ingredients, instructions</p>
              <p><strong>Optional columns:</strong> calories, protein, carbs, fat, fiber, prep_time, cook_time, servings, tags, description</p>
              <p><strong>Meal types:</strong> breakfast, lunch, dinner, snack</p>
              <p><strong>Ingredients:</strong> Separate with semicolons (;) or newlines</p>
              <p><strong>Instructions:</strong> Separate steps with semicolons (;) or newlines</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}