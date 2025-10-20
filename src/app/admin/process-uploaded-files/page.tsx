"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  type: string;
  path: string;
  size?: number;
}

interface ProcessResult {
  success: boolean;
  parsedCount?: number;
  insertedCount?: number;
  message?: string;
  preview?: any[];
}

export default function ProcessUploadedFilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [results, setResults] = useState<{ [filename: string]: ProcessResult }>({});

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/meals/library/process-files?action=list');
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error("Failed to load uploaded files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return '📄';
      case 'CSV': return '📊';
      default: return '📁';
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-red-100 text-red-800';
      case 'CSV': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProcessFile = async (file: UploadedFile) => {
    if (file.type === 'PDF') {
      toast.info("PDF files need manual text extraction. Please copy the text from the PDF and use the main upload page.");
      return;
    }

    setProcessingFile(file.name);
    
    try {
      // First, read the file content
      const readResponse = await fetch(`/api/meals/library/process-files?action=read&file=${encodeURIComponent(file.name)}`);
      const fileData = await readResponse.json();
      
      if (!fileData.success) {
        throw new Error(fileData.message || 'Failed to read file');
      }

      // Then process with appropriate parser
      let parseResponse;
      if (file.type === 'CSV') {
        parseResponse = await fetch('/api/meals/library/parse-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvText: fileData.content })
        });
      } else {
        throw new Error('Unsupported file type for automatic processing');
      }

      const result = await parseResponse.json();
      setResults(prev => ({ ...prev, [file.name]: result }));

      if (result.success) {
        toast.success(`Successfully processed ${file.name}: ${result.insertedCount} meals uploaded`);
      } else {
        toast.error(`Failed to process ${file.name}: ${result.message}`);
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast.error(`Failed to process ${file.name}`);
      setResults(prev => ({ 
        ...prev, 
        [file.name]: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        }
      }));
    } finally {
      setProcessingFile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Process Uploaded Files</h1>
        <p className="text-gray-600">Process your uploaded PDF and CSV meal files</p>
      </div>

      {/* Files List */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Files ({files.length})
          </CardTitle>
          <CardDescription>
            Files found in src/data/meals/ directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">Upload your PDF or CSV files to src/data/meals/</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getFileColor(file.type)}>
                          {file.type}
                        </Badge>
                        {file.size && (
                          <span className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {results[file.name] && (
                      <div className="mr-2">
                        {results[file.name].success ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Processed ({results[file.name].insertedCount} meals)
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {file.type === 'PDF' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast.info("For PDF files, please copy the text manually and use the main upload page with PDF parser.")}
                      >
                        📄 Manual Processing Required
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleProcessFile(file)}
                        disabled={processingFile === file.name || results[file.name]?.success}
                      >
                        {processingFile === file.name ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : results[file.name]?.success ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Processed
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Process File
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Instructions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Processing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">📄 PDF Files</h3>
            <p className="text-sm text-gray-600 mb-2">
              PDF files require manual text extraction due to formatting complexity.
            </p>
            <ol className="text-sm text-gray-600 space-y-1 ml-4">
              <li>1. Open the PDF file</li>
              <li>2. Select all text (Ctrl+A / Cmd+A)</li>
              <li>3. Copy the text (Ctrl+C / Cmd+C)</li>
              <li>4. Go to the main upload page and use the PDF parser</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">📊 CSV Files</h3>
            <p className="text-sm text-gray-600">
              CSV files can be processed automatically. Click "Process File" to parse and upload meals.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(results).map(([filename, result]) => (
                <div key={filename} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{filename}</span>
                    {result.success ? (
                      <Badge className="bg-green-100 text-green-800">Success</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Failed</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.preview && result.preview.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Sample meals:</p>
                      <ul className="text-xs text-gray-600 ml-4">
                        {result.preview.slice(0, 3).map((meal: any, i: number) => (
                          <li key={i}>• {meal.name} ({meal.mealType})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mt-8 flex gap-4">
        <Button variant="outline" onClick={fetchFiles}>
          <Download className="w-4 h-4 mr-2" />
          Refresh Files
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/admin/meal-upload'}>
          <Upload className="w-4 h-4 mr-2" />
          Manual Upload
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/admin/meals-library'}>
          <FileText className="w-4 h-4 mr-2" />
          View Library
        </Button>
      </div>
    </div>
  );
}