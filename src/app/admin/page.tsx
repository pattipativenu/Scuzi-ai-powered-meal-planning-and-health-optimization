"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image, Database, BarChart3, Settings } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Scuzi Admin Dashboard</h1>
        <p className="text-gray-600">Manage meals library, generate images, and monitor system performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Meal Upload */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Meal Upload
            </CardTitle>
            <CardDescription>
              Bulk upload your 56 meals to the library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Upload breakfast, lunch, dinner, and snack recipes with full nutrition data and instructions.
            </p>
            <Link href="/admin/meal-upload">
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Meals
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Process PDF Files */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Process PDF Meals
            </CardTitle>
            <CardDescription>
              Clean database and upload your 2 PDF meal files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Process your 56 High-Protein meals and Extract recipe details PDFs. Clean, focused meal library.
            </p>
            <Link href="/admin/process-pdfs">
              <Button className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Process PDFs
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Image Generation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-green-600" />
              Image Generation
            </CardTitle>
            <CardDescription>
              Generate AI images using G1 V2 model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Create professional food photography for all meals and store in S3 bucket.
            </p>
            <Link href="/admin/generate-images">
              <Button className="w-full" variant="outline">
                <Image className="w-4 h-4 mr-2" />
                Generate Images
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Meals Library */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Meals Library
            </CardTitle>
            <CardDescription>
              Browse and manage meal database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View all meals in the library, check nutrition data, and manage meal categories.
            </p>
            <Link href="/admin/meals-library">
              <Button className="w-full" variant="outline">
                <Database className="w-4 h-4 mr-2" />
                View Library
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Plan Ahead Testing */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Plan Ahead Testing
            </CardTitle>
            <CardDescription>
              Test Claude 3.5 Sonnet V2 integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Test the enhanced meal planning with WHOOP data integration and library selection.
            </p>
            <Link href="/plan-ahead">
              <Button className="w-full" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Test Plan Ahead
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              API Endpoints
            </CardTitle>
            <CardDescription>
              API documentation and testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  POST /api/meals/library/bulk-upload
                </code>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  POST /api/meals/library/generate-images
                </code>
              </div>
              <div>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  GET /api/meals/library
                </code>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              View API Docs
            </Button>
          </CardContent>
        </Card>

        {/* Duplicate Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-600" />
              Duplicate Management
            </CardTitle>
            <CardDescription>
              Find and manage duplicate meals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Automatically detect duplicate meals and keep the highest quality versions.
            </p>
            <Button className="w-full" variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage Duplicates
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              System Status
            </CardTitle>
            <CardDescription>
              Monitor system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>AWS Bedrock:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span>WHOOP API:</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm">
              View Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Upload className="w-6 h-6" />
            <span className="text-sm">Bulk Upload</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Image className="w-6 h-6" />
            <span className="text-sm">Generate All Images</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Database className="w-6 h-6" />
            <span className="text-sm">View Library Stats</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            <span className="text-sm">Test Plan Generation</span>
          </Button>
        </div>
      </div>

      {/* Workflow Overview */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Clean Meal Library Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              1
            </div>
            <h3 className="font-medium">Process PDFs</h3>
            <p className="text-sm text-gray-600">Clean DB + upload 2 PDF files</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              2
            </div>
            <h3 className="font-medium">Chat Integration</h3>
            <p className="text-sm text-gray-600">"Add to Library" from chat</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              3
            </div>
            <h3 className="font-medium">On-Demand Images</h3>
            <p className="text-sm text-gray-600">AWS Titan G1V2 generation</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              4
            </div>
            <h3 className="font-medium">WHOOP Integration</h3>
            <p className="text-sm text-gray-600">Smart meal recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
}