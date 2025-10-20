"use client";

import { useState, useEffect } from 'react';
import { MealLibraryUpload } from '@/components/MealLibraryUpload';
import { Database, Image, FileText, TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface LibraryStats {
  totalMeals: number;
  mealsWithImages: number;
  mealsByType: Record<string, number>;
  availableTags: string[];
}

export default function MealLibraryAdminPage() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/meals/library');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalMeals: data.pagination.total,
          mealsWithImages: 0, // Will be updated by separate call
          mealsByType: {},
          availableTags: [],
        });
      }

      // Get detailed stats
      const statsResponse = await fetch('/api/plan-ahead/generate-from-library');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.library_stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const generateAllImages = async () => {
    if (!confirm('Generate images for all meals without images? This may take several minutes.')) {
      return;
    }

    try {
      setRefreshing(true);
      const response = await fetch('/api/meals/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Image generation complete: ${result.results.success} success, ${result.results.failed} failed`);
        await fetchStats();
      } else {
        alert('Image generation failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating images:', error);
      alert('Error generating images');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meal Library Administration</h1>
          <p className="text-muted-foreground">
            Manage your meal library, upload CSV files, and generate images with AWS Titan G1V2
          </p>
        </div>

        {/* Stats Dashboard */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Meals</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalMeals}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Image className="w-5 h-5 text-green-500" />
                <span className="text-sm text-muted-foreground">With Images</span>
              </div>
              <p className="text-3xl font-bold">{stats.mealsWithImages}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalMeals > 0 ? Math.round((stats.mealsWithImages / stats.totalMeals) * 100) : 0}% complete
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">Meal Types</span>
              </div>
              <p className="text-3xl font-bold">{Object.keys(stats.mealsByType).length}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-muted-foreground">Available Tags</span>
              </div>
              <p className="text-3xl font-bold">{stats.availableTags.length}</p>
            </div>
          </motion.div>
        ) : null}

        {/* Meal Types Breakdown */}
        {stats && Object.keys(stats.mealsByType).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Meals by Type</h3>
              <button
                onClick={refreshStats}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(stats.mealsByType).map(([type, count]) => (
                <div key={type} className="text-center p-3 bg-muted rounded-lg">
                  <p className="font-medium">{type}</p>
                  <p className="text-2xl font-bold text-primary">{count}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={generateAllImages}
              disabled={refreshing || !stats || stats.totalMeals === stats.mealsWithImages}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Image className="w-4 h-4" />
              Generate Missing Images
              {stats && stats.totalMeals > stats.mealsWithImages && (
                <span className="bg-primary-foreground text-primary px-2 py-1 rounded text-xs">
                  {stats.totalMeals - stats.mealsWithImages} needed
                </span>
              )}
            </button>

            <button
              onClick={() => window.location.href = '/plan-ahead'}
              className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg hover:bg-muted"
            >
              <TrendingUp className="w-4 h-4" />
              Test Meal Generation
            </button>
          </div>
        </motion.div>

        {/* Upload Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MealLibraryUpload />
        </motion.div>

        {/* Available Tags */}
        {stats && stats.availableTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-lg p-6 mt-8"
          >
            <h3 className="text-lg font-semibold mb-4">Available Tags</h3>
            <div className="flex flex-wrap gap-2">
              {stats.availableTags.slice(0, 20).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
              {stats.availableTags.length > 20 && (
                <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                  +{stats.availableTags.length - 20} more
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}