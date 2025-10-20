"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ProcessResult {
  success: boolean;
  parsedCount?: number;
  insertedCount?: number;
  message?: string;
  preview?: any[];
}

export default function ProcessPDFsPage() {
  const [pdf1Text, setPdf1Text] = useState("");
  const [pdf2Text, setPdf2Text] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ [key: string]: ProcessResult }>({});
  const [currentStats, setCurrentStats] = useState({ totalMeals: 0 });

  const pdfFiles = [
    {
      id: 'pdf1',
      name: '56 High-Protein Gut-Healthy Meals for Recovery and Energy (1).pdf',
      description: 'Your main meal collection PDF',
      text: pdf1Text,
      setText: setPdf1Text
    },
    {
      id: 'pdf2', 
      name: 'Extract recipe details.pdf',
      description: 'Additional recipe details PDF',
      text: pdf2Text,
      setText: setPdf2Text
    }
  ];

  const fetchCurrentStats = async () => {
    try {
      const response = await fetch('/api/meals/library/view-data?limit=1');
      const data = await response.json();
      setCurrentStats({ totalMeals: data.statistics.totalMeals });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const processPDF = async (pdfId: string, text: string) => {
    if (!text.trim()) {
      toast.error("Please paste the PDF text first");
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/meals/library/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const result = await response.json();
      setResults(prev => ({ ...prev, [pdfId]: result }));

      if (result.success) {
        toast.success(`Successfully processed ${pdfId}: ${result.insertedCount} meals added`);
        await fetchCurrentStats();
      } else {
        toast.error(`Failed to process ${pdfId}: ${result.message}`);
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast.error(`Failed to process ${pdfId}`);
      setResults(prev => ({ 
        ...prev, 
        [pdfId]: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        }
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm("Are you sure you want to clear all meals from the database?")) {
      return;
    }

    try {
      const response = await fetch('/api/meals/library/audit-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmDelete: true })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Cleared ${result.deletedCount} meals from database`);
        setResults({});
        await fetchCurrentStats();
      }
    } catch (error) {
      toast.error("Failed to clear database");
    }
  };

  useEffect(() => {
    fetchCurrentStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Process Your PDF Meal Files</h1>
        <p className="text-gray-600">Clean database and upload only your 2 PDF meal collections</p>
      </div>

      {/* Current Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Database Status</span>
            <Badge variant={currentStats.totalMeals === 0 ? "secondary" : "default"}>
              {currentStats.totalMeals} meals
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {currentStats.totalMeals === 0 
                  ? "Database is clean and ready for your PDF meals" 
                  : `Database contains ${currentStats.totalMeals} meals`
                }
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearDatabase}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PDF Processing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {pdfFiles.map((pdf) => (
          <Card key={pdf.id} className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                PDF {pdf.id === 'pdf1' ? '1' : '2'}
              </CardTitle>
              <CardDescription>
                <div className="font-medium text-sm">{pdf.name}</div>
                <div className="text-xs text-gray-500 mt-1">{pdf.description}</div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Paste PDF Text Content
                </label>
                <Textarea
                  value={pdf.text}
                  onChange={(e) => pdf.setText(e.target.value)}
                  placeholder={`Copy all text from ${pdf.name} and paste here...`}
                  className="min-h-[200px] text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Open the PDF, select all (Ctrl+A), copy (Ctrl+C), and paste here
                </p>
              </div>

              <Button
                onClick={() => processPDF(pdf.id, pdf.text)}
                disabled={isProcessing || !pdf.text.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Process {pdf.id.toUpperCase()}
                  </>
                )}
              </Button>

              {/* Results */}
              {results[pdf.id] && (
                <div className={`p-3 rounded-lg border ${
                  results[pdf.id]!.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {results[pdf.id]!.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`font-medium text-sm ${
                      results[pdf.id]!.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {results[pdf.id]!.success ? 'Success!' : 'Failed'}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${
                    results[pdf.id]!.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {results[pdf.id]!.message}
                  </p>

                  {results[pdf.id]!.preview && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Sample meals:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {results[pdf.id]!.preview!.slice(0, 3).map((meal: any, i: number) => (
                          <li key={i}>• {meal.name} ({meal.mealType})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📋 Processing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Step 1: Clear Database (if needed)</h3>
            <p className="text-sm text-gray-600">
              If the database has old/test data, click "Clear Database" to start fresh.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Step 2: Process PDF 1</h3>
            <p className="text-sm text-gray-600">
              Open "56 High-Protein Gut-Healthy Meals..." PDF, copy all text, paste and process.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Step 3: Process PDF 2</h3>
            <p className="text-sm text-gray-600">
              Open "Extract recipe details.pdf", copy all text, paste and process.
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🤖 Smart Parser Features:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Extracts ONLY meal data (titles, ingredients, instructions, nutrition)</li>
              <li>✅ Ignores all introductory text and explanations</li>
              <li>✅ Automatically determines meal types (breakfast, lunch, dinner, snack)</li>
              <li>✅ Parses nutrition data and health tags</li>
              <li>❌ No images stored (will use AWS Titan G1V2 on-demand)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 flex gap-4">
        <Button variant="outline" onClick={fetchCurrentStats}>
          <FileText className="w-4 h-4 mr-2" />
          Refresh Stats
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/api/meals/library/view-data?format=html'}>
          <FileText className="w-4 h-4 mr-2" />
          View Database
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/admin/meals-library'}>
          <FileText className="w-4 h-4 mr-2" />
          Admin Panel
        </Button>
      </div>
    </div>
  );
}