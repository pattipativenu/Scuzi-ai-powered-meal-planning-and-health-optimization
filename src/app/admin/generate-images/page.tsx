'use client';

import { useState, useEffect } from 'react';

interface GenerationStatus {
  total: number;
  withImages: number;
  withoutImages: number;
  progress: number;
  mealsWithoutImages: { mealId: string; mealName: string }[];
}

interface GenerationResult {
  mealId: string;
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export default function GenerateImagesPage() {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/meals/generate-images');
      const data = await response.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const generateSingleImage = async (mealId: string) => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/meals/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'single', mealId }),
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchStatus();
        alert(`Image generated for ${result.mealId}!`);
      } else {
        alert(`Failed to generate image: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating single image:', error);
      alert('Error generating image');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBatchImages = async (batchSize: number = 5) => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/meals/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch', batchSize }),
      });
      
      const result = await response.json();
      if (result.success) {
        setResults(result.results || []);
        await fetchStatus();
        alert(`Batch complete! ${result.processed} images generated, ${result.failed} failed.`);
      } else {
        alert(`Failed to generate batch: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating batch:', error);
      alert('Error generating batch');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllImages = async () => {
    if (!confirm(`This will generate ${status?.withoutImages} images. This may take a while. Continue?`)) {
      return;
    }

    try {
      setIsGenerating(true);
      setCurrentProgress(0);
      
      const response = await fetch('/api/meals/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'all' }),
      });
      
      const result = await response.json();
      if (result.success) {
        setResults(result.results || []);
        await fetchStatus();
        alert(`All images generated! ${result.successful} successful, ${result.failed} failed.`);
      } else {
        alert(`Failed to generate all images: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating all images:', error);
      alert('Error generating all images');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!status) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Generate Meal Images</h1>
      
      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generation Status</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{status.total}</div>
            <div className="text-sm text-gray-600">Total Meals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{status.withImages}</div>
            <div className="text-sm text-gray-600">With Images</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{status.withoutImages}</div>
            <div className="text-sm text-gray-600">Without Images</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{status.progress}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate Images</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => generateBatchImages(5)}
            disabled={isGenerating || status.withoutImages === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Generate 5 Images
          </button>
          <button
            onClick={() => generateBatchImages(10)}
            disabled={isGenerating || status.withoutImages === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            Generate 10 Images
          </button>
          <button
            onClick={generateAllImages}
            disabled={isGenerating || status.withoutImages === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            Generate All ({status.withoutImages}) Images
          </button>
          <button
            onClick={fetchStatus}
            disabled={isGenerating}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
          >
            Refresh Status
          </button>
        </div>
        
        {isGenerating && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span>Generating images... This may take several minutes.</span>
            </div>
          </div>
        )}
      </div>

      {/* Meals Without Images */}
      {status.withoutImages > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Meals Without Images ({status.withoutImages})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {status.mealsWithoutImages.map((meal) => (
              <div key={meal.mealId} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{meal.mealId}</div>
                  <div className="text-sm text-gray-600 truncate">{meal.mealName}</div>
                </div>
                <button
                  onClick={() => generateSingleImage(meal.mealId)}
                  disabled={isGenerating}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Generation Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{result.mealId}</span>
                  <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
                {result.success && result.imageUrl && (
                  <div className="text-xs text-gray-600 mt-1">
                    <a href={result.imageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      View Image
                    </a>
                  </div>
                )}
                {!result.success && result.error && (
                  <div className="text-xs text-red-600 mt-1">{result.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}