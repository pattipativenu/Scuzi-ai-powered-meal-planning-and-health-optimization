"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Image, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

interface ImageStats {
  totalMeals: number;
  withImages: number;
  withoutImages: number;
  imageProgress: number;
}

interface MealWithoutImage {
  id: number;
  name: string;
  mealType: string;
}

interface GenerationResult {
  successful: Array<{
    id: number;
    name: string;
    imageUrl: string;
    status: string;
  }>;
  failed: Array<{
    id: number;
    name: string;
    error: string;
  }>;
}

export default function GenerateImagesPage() {
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [mealsWithoutImages, setMealsWithoutImages] = useState<MealWithoutImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/meals/library/generate-images?stats=true');
      const data = await response.json();
      setStats(data.statistics);
      setMealsWithoutImages(data.mealsWithoutImages);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const generateAllImages = async () => {
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const response = await fetch('/api/meals/library/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generateAll: true }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGenerationResult(result.results);
        toast.success(`Generated ${result.summary.successCount} images successfully!`);
        // Refresh stats
        await fetchStats();
      } else {
        toast.error(result.message || "Image generation failed");
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Failed to generate images");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSpecificImages = async (mealIds: number[]) => {
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const response = await fetch('/api/meals/library/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealIds }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGenerationResult(result.results);
        toast.success(`Generated ${result.summary.successCount} images successfully!`);
        // Refresh stats
        await fetchStats();
      } else {
        toast.error(result.message || "Image generation failed");
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Failed to generate images");
    } finally {
      setIsGenerating(false);
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
        <h1 className="text-3xl font-bold mb-2">Meal Image Generation</h1>
        <p className="text-gray-600">Generate AI images for meals using G1 V2 model</p>
      </div>

      {/* Statistics Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Image Generation Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalMeals}</div>
                  <div className="text-sm text-blue-800">Total Meals</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.withImages}</div>
                  <div className="text-sm text-green-800">With Images</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.withoutImages}</div>
                  <div className="text-sm text-orange-800">Need Images</div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">{stats.imageProgress}%</span>
                </div>
                <Progress value={stats.imageProgress} className="h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate Images</CardTitle>
          <CardDescription>
            Generate AI images for meals that don't have images yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={generateAllImages} 
              disabled={isGenerating || (stats?.withoutImages === 0)}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Images...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate All Missing Images ({stats?.withoutImages || 0})
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={fetchStats}
              disabled={isGenerating}
            >
              Refresh Stats
            </Button>
          </div>

          {stats?.withoutImages === 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">All meals have images!</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meals Without Images */}
      {mealsWithoutImages.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Meals Without Images</CardTitle>
            <CardDescription>
              {mealsWithoutImages.length} meals need images generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mealsWithoutImages.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{meal.name}</div>
                    <Badge variant="secondary" className="text-xs">
                      {meal.mealType}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateSpecificImages([meal.id])}
                    disabled={isGenerating}
                  >
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Results */}
      {generationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Successful generations */}
              {generationResult.successful.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Successfully Generated ({generationResult.successful.length})
                  </h3>
                  <div className="space-y-2">
                    {generationResult.successful.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                        <span className="text-sm">{result.name}</span>
                        <Badge variant="default" className="bg-green-600">
                          Generated
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed generations */}
              {generationResult.failed.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Failed ({generationResult.failed.length})
                  </h3>
                  <div className="space-y-2">
                    {generationResult.failed.map((result) => (
                      <div key={result.id} className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{result.name}</span>
                          <Badge variant="destructive">
                            Failed
                          </Badge>
                        </div>
                        <div className="text-xs text-red-600 mt-1">{result.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}