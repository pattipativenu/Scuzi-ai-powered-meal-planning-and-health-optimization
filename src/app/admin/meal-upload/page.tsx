"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadResult {
  success: boolean;
  insertedCount?: number;
  validationErrors?: any[];
  message?: string;
}

export default function MealUploadPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadMode, setUploadMode] = useState<'json' | 'pdf' | 'csv'>('pdf');
  const [csvInput, setCsvInput] = useState("");

  const sampleMeal = {
    name: "Spaghetti Squash Beef & Lentil Bolognese",
    tagline: "Low-Carb Veggie Pasta with Hearty Sauce",
    description: "This dish cleverly boosts the nutrition of a classic pasta dinner by incorporating spaghetti squash and lentils.",
    mealType: "dinner",
    prepTime: 15,
    cookTime: 45,
    servings: 4,
    ingredients: [
      "Spaghetti squash – 1 large (about 3-4 lbs)",
      "Lean ground beef – 8 oz (90-95% lean)",
      "Cooked lentils – 1 cup (or canned brown/green lentils, drained)",
      "Crushed tomatoes – 1 can (28 oz, no salt added if possible)",
      "Tomato paste – 1 tbsp (for richness)",
      "Onion – 1 small, diced",
      "Carrot – 1, finely diced",
      "Celery – 1 rib, finely diced",
      "Garlic – 3 cloves, minced",
      "Dried oregano – 1 tsp",
      "Dried basil – 1 tsp",
      "Olive oil – 1 tbsp",
      "Salt & pepper – to taste",
      "Fresh basil or parsley – for garnish (optional)",
      "Grated Parmesan – 2 tbsp (optional for serving)"
    ],
    instructions: [
      "Roast Spaghetti Squash: Preheat oven to 400°F (200°C). Cut squash in half lengthwise, scoop out seeds. Brush with olive oil, place cut-side down on baking sheet. Roast 30-40 minutes until tender.",
      "Make Bolognese: Heat olive oil in large pot over medium-high. Add onion, carrot, celery. Sauté 5 minutes until softened. Add garlic, cook 30 seconds.",
      "Add ground beef, brown while breaking up (~5 min). Drain excess fat.",
      "Stir in tomato paste, cook 1 minute. Add crushed tomatoes, lentils, oregano, basil, salt and pepper. Bring to simmer.",
      "Reduce heat to low, cover and simmer 15-20 minutes, stirring occasionally.",
      "Serve: Plate spaghetti squash 'noodles', top with bolognese sauce. Garnish with fresh herbs and Parmesan if desired."
    ],
    nutrition: {
      calories: 350,
      protein: 24,
      fat: 12,
      carbs: 40,
      fiber: 10
    },
    tags: ["Better Performance", "Recovery", "Better Sleep"],
    whyHelpful: "This bolognese is comfort food reimagined to align with your WHOOP-driven goals: fueling muscles, reducing inflammation, and promoting overall health without sacrificing taste or satisfaction. By swapping regular pasta with spaghetti squash, we significantly cut down on refined carbs and calories while adding fiber, vitamins, and hydration. The mix of plant and animal proteins provides amino acids for muscle repair, while high fiber supports gut health and steady energy levels."
  };

  const handleUpload = async () => {
    if (uploadMode === 'json' && !jsonInput.trim()) {
      toast.error("Please enter meal data");
      return;
    }
    
    if (uploadMode === 'pdf' && !pdfText.trim()) {
      toast.error("Please paste your PDF text");
      return;
    }
    
    if (uploadMode === 'csv' && !csvInput.trim()) {
      toast.error("Please paste your CSV content");
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      let response;
      
      if (uploadMode === 'pdf') {
        // Use PDF parser
        response = await fetch('/api/meals/library/parse-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: pdfText }),
        });
      } else if (uploadMode === 'csv') {
        // Use CSV parser
        response = await fetch('/api/meals/library/parse-csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvText: csvInput }),
        });
      } else {
        // Use JSON bulk upload
        const mealsData = JSON.parse(jsonInput);
        response = await fetch('/api/meals/library/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mealsData),
        });
      }

      const result = await response.json();
      setUploadResult(result);

      if (result.success) {
        toast.success(`Successfully uploaded ${result.insertedCount || result.parsedCount} meals!`);
        if (uploadMode === 'pdf') {
          setPdfText("");
        } else if (uploadMode === 'csv') {
          setCsvInput("");
        } else {
          setJsonInput("");
        }
      } else {
        toast.error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = uploadMode === 'json' ? "Invalid JSON format or upload failed" : 
                       uploadMode === 'csv' ? "CSV parsing failed" : "PDF parsing failed";
      toast.error(errorMsg);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const loadSampleData = () => {
    const sampleData = {
      meals: [sampleMeal]
    };
    setJsonInput(JSON.stringify(sampleData, null, 2));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meal Library Bulk Upload</h1>
        <p className="text-gray-600">Upload your 56 meals to the Scuzi Meals Library</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Meals
            </CardTitle>
            <CardDescription>
              Choose your upload method: Smart PDF parsing (recommended) or manual JSON format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Mode Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setUploadMode('pdf')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMode === 'pdf' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📄 PDF Text
              </button>
              <button
                onClick={() => setUploadMode('csv')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMode === 'csv' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 CSV File
              </button>
              <button
                onClick={() => setUploadMode('json')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMode === 'json' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📝 JSON
              </button>
            </div>
            {uploadMode === 'pdf' ? (
              <div>
                <label className="block text-sm font-medium mb-2">
                  PDF Text Content
                </label>
                <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✅ Smart Parser Guarantee:</strong> Only meal data will be stored. 
                    All introductory text, links, and explanations will be automatically ignored.
                  </p>
                </div>
                <Textarea
                  value={pdfText}
                  onChange={(e) => setPdfText(e.target.value)}
                  placeholder="Paste ALL text from your PDF here (including introductions, explanations, etc.). The smart parser will extract ONLY the meal data..."
                  className="min-h-[300px] text-sm"
                />
                <p className="text-xs text-gray-600 mt-2">
                  💡 Tip: Copy everything from your PDF - the parser will automatically find and extract only the meal recipes.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meal Data (JSON Format)
                </label>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your meal JSON data here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadMode === 'pdf' ? 'Parsing & Uploading...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadMode === 'pdf' ? 'Parse & Upload Meals' : 'Upload Meals'}
                  </>
                )}
              </Button>
              {uploadMode === 'json' && (
                <Button variant="outline" onClick={loadSampleData}>
                  Load Sample
                </Button>
              )}
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className={`p-4 rounded-lg border ${
                uploadResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    uploadResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                  </span>
                </div>
                
                {uploadResult.message && (
                  <p className={`text-sm ${
                    uploadResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {uploadResult.message}
                  </p>
                )}

                {uploadResult.validationErrors && uploadResult.validationErrors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700 mb-2">Validation Errors:</p>
                    <div className="space-y-2">
                      {uploadResult.validationErrors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 bg-red-100 p-2 rounded">
                          <strong>{error.name}:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {error.errors.map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions & Sample */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Instructions</CardTitle>
            <CardDescription>
              {uploadMode === 'pdf' ? 'Smart PDF parsing instructions' : 'JSON format requirements'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadMode === 'pdf' ? (
              <>
                <div>
                  <h3 className="font-semibold mb-2 text-green-800">📄 PDF Text Upload (Recommended)</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Step 1:</strong> Open your PDF and select all text (Ctrl+A / Cmd+A)</p>
                    <p><strong>Step 2:</strong> Copy everything (Ctrl+C / Cmd+C)</p>
                    <p><strong>Step 3:</strong> Paste into the text area above</p>
                    <p><strong>Step 4:</strong> Click "Parse & Upload Meals"</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">🤖 Smart Parser Features:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ Automatically finds meal titles (e.g., "1. Kimchi & Egg Brown Rice Bowl")</li>
                    <li>✅ Extracts taglines, prep time, ingredients, instructions</li>
                    <li>✅ Parses nutrition data and identifies tags</li>
                    <li>✅ Ignores ALL introductory text and explanations</li>
                    <li>✅ Determines meal type from context (breakfast, lunch, etc.)</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🛡️ Data Safety Guarantee:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>❌ No introductory paragraphs will be stored</li>
                    <li>❌ No links or references will be saved</li>
                    <li>❌ No explanatory text will be included</li>
                    <li>✅ Only clean meal data goes to your database</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Required JSON Structure:</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`{
  "meals": [
    {
      "name": "Meal Name",
      "tagline": "Optional tagline",
      "description": "Brief description",
      "mealType": "breakfast|lunch|dinner|snack",
      "prepTime": 15,
      "cookTime": 30,
      "servings": 4,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"],
      "nutrition": {
        "calories": 350,
        "protein": 24,
        "fat": 12,
        "carbs": 40,
        "fiber": 10
      },
      "tags": ["Recovery", "Better Sleep"],
      "whyHelpful": "Explanation of benefits"
    }
  ]
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Meal Types:</h3>
              <ul className="text-sm space-y-1">
                <li>• <code>breakfast</code> - Morning meals</li>
                <li>• <code>lunch</code> - Midday meals</li>
                <li>• <code>dinner</code> - Evening meals</li>
                <li>• <code>snack</code> - Snacks and small meals</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Recommended Tags:</h3>
              <ul className="text-sm space-y-1">
                <li>• <code>Recovery</code> - Post-workout recovery</li>
                <li>• <code>Better Sleep</code> - Sleep optimization</li>
                <li>• <code>Better Performance</code> - Energy & performance</li>
                <li>• <code>Anti-Inflammatory</code> - Reduces inflammation</li>
                <li>• <code>High Protein</code> - Protein-rich meals</li>
                <li>• <code>Low Carb</code> - Lower carbohydrate content</li>
              </ul>
            </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>Tip:</strong> Click "Load Sample" to see the exact format with the meal you provided as an example.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}