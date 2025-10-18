"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, MessageCircle, Clock, Bookmark, Plus, Minus, Heart, Flag, ImageIcon } from "lucide-react";
import { mockMeals } from "@/lib/mockMeals";
import { useState } from "react";

interface MealDetailPageProps {
  params: {
    mealId: string;
  };
}

export default function MealDetailPage({ params }: MealDetailPageProps) {
  const meal = mockMeals[params.mealId];
  const [servings, setServings] = useState(meal?.servings || 4);
  const [activeTab, setActiveTab] = useState<"ingredients" | "nutrition">("ingredients");

  if (!meal) {
    notFound();
  }

  const baseServings = meal.servings;
  const servingMultiplier = servings / baseServings;

  const adjustIngredientAmount = (amount: string) => {
    const numberMatch = amount.match(/(\d+\.?\d*)/);
    if (numberMatch) {
      const originalNumber = parseFloat(numberMatch[1]);
      const adjustedNumber = (originalNumber * servingMultiplier).toFixed(1).replace(/\.0$/, '');
      return amount.replace(numberMatch[1], adjustedNumber);
    }
    return amount;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 hover:opacity-70 mb-8 transition-opacity"
          style={{
            fontFamily: '"General Sans", sans-serif',
            fontSize: '15px',
            color: 'rgb(39, 39, 42)'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Week
        </Link>

        {/* Hero Section - Desktop/Tablet: Image Right, Content Left */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Left Side - Content */}
          <div className="flex flex-col justify-center order-2 md:order-1">
            <h1 style={{
              fontFamily: '"Right Grotesk Spatial", sans-serif',
              fontWeight: 500,
              fontSize: '48px',
              lineHeight: '56px',
              color: 'rgb(39, 39, 42)',
              marginBottom: '16px'
            }}>
              {meal.name}
            </h1>
            
            <p style={{
              fontFamily: '"General Sans", sans-serif',
              fontSize: '17px',
              lineHeight: '24px',
              color: 'rgb(82, 82, 91)',
              marginBottom: '24px'
            }}>
              {meal.description}
            </p>

            {/* Rating, Notes, Duration - Inline */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: 'rgb(39, 39, 42)'
                }}>
                  4.5
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-gray-600" />
                <span style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontSize: '15px',
                  color: 'rgb(82, 82, 91)'
                }}>
                  2 Notes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontSize: '15px',
                  color: 'rgb(82, 82, 91)'
                }}>
                  {(meal.prepTime || 0) + (meal.cookTime || 0)} mins cook
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  borderRadius: '33px'
                }}
              >
                <Bookmark className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="order-1 md:order-2">
            <div className="relative w-full aspect-[4/3] overflow-hidden" style={{ borderRadius: '33px' }}>
              <Image
                src={meal.image}
                alt={meal.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Recipe Details Section - Desktop/Tablet: Instructions Left, Ingredients/Nutrition Right */}
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12">
          {/* Left Column - Step-by-Step Instructions */}
          <div>
            <h2 style={{
              fontFamily: '"Right Grotesk Spatial", sans-serif',
              fontWeight: 500,
              fontSize: '30px',
              lineHeight: '36px',
              color: 'rgb(39, 39, 42)',
              marginBottom: '24px'
            }}>
              Step-by-Step Instructions
            </h2>

            <div className="space-y-6">
              {meal.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-4">
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgb(39, 39, 42)',
                      color: 'white',
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '16px',
                      fontWeight: 500
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-2">
                    <p style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'rgb(82, 82, 91)',
                      marginBottom: '8px'
                    }}>
                      Step {index + 1}
                    </p>
                    <p style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: '15px',
                      lineHeight: '21px',
                      color: 'rgb(39, 39, 42)'
                    }}>
                      {instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Ingredients + Nutrition with Tabs */}
          <div>
            {/* Toggle Tabs */}
            <div className="flex gap-2 mb-6 sticky top-0 bg-white py-2 z-10">
              <button
                onClick={() => setActiveTab("ingredients")}
                className="flex-1 py-3 transition-all"
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  borderRadius: '33px',
                  backgroundColor: activeTab === "ingredients" ? 'rgb(39, 39, 42)' : 'rgb(244, 244, 245)',
                  color: activeTab === "ingredients" ? 'white' : 'rgb(82, 82, 91)'
                }}
              >
                Ingredients
              </button>
              <button
                onClick={() => setActiveTab("nutrition")}
                className="flex-1 py-3 transition-all"
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  borderRadius: '33px',
                  backgroundColor: activeTab === "nutrition" ? 'rgb(39, 39, 42)' : 'rgb(244, 244, 245)',
                  color: activeTab === "nutrition" ? 'white' : 'rgb(82, 82, 91)'
                }}
              >
                Nutrition
              </button>
            </div>

            {/* Ingredients Tab */}
            {activeTab === "ingredients" && (
              <div>
                {/* Serving Size Selector */}
                <div className="mb-6 p-4 bg-gray-50" style={{ borderRadius: '20px' }}>
                  <p style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: '15px',
                    color: 'rgb(82, 82, 91)',
                    marginBottom: '12px'
                  }}>
                    Serving Size
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 hover:border-black transition-colors"
                      style={{ borderRadius: '50%' }}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '24px',
                      fontWeight: 500,
                      color: 'rgb(39, 39, 42)',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}>
                      {servings}
                    </span>
                    <button
                      onClick={() => setServings(servings + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 hover:border-black transition-colors"
                      style={{ borderRadius: '50%' }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ingredients List */}
                <ul className="space-y-4">
                  {meal.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3 pb-4 border-b border-gray-200">
                      <div className="w-2 h-2 rounded-full bg-black mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <span style={{
                          fontFamily: '"Right Grotesk Wide", sans-serif',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: 'rgb(39, 39, 42)'
                        }}>
                          {adjustIngredientAmount(ingredient.amount)}
                        </span>
                        <span style={{
                          fontFamily: '"General Sans", sans-serif',
                          fontSize: '15px',
                          color: 'rgb(82, 82, 91)',
                          marginLeft: '8px'
                        }}>
                          {ingredient.name}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nutrition Tab */}
            {activeTab === "nutrition" && (
              <div>
                <p style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontSize: '15px',
                  color: 'rgb(82, 82, 91)',
                  marginBottom: '16px'
                }}>
                  Per serving ({Math.round(meal.nutrition.calories / baseServings)} kcal)
                </p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: '15px',
                      color: 'rgb(39, 39, 42)'
                    }}>
                      Calories
                    </span>
                    <span style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: 'rgb(39, 39, 42)'
                    }}>
                      {Math.round(meal.nutrition.calories / baseServings)} kcal
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: '15px',
                      color: 'rgb(39, 39, 42)'
                    }}>
                      Protein
                    </span>
                    <span style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: 'rgb(39, 39, 42)'
                    }}>
                      {Math.round(meal.nutrition.protein / baseServings)}g
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: '15px',
                      color: 'rgb(39, 39, 42)'
                    }}>
                      Carbohydrates
                    </span>
                    <span style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: 'rgb(39, 39, 42)'
                    }}>
                      {Math.round(meal.nutrition.carbs / baseServings)}g
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: '15px',
                      color: 'rgb(39, 39, 42)'
                    }}>
                      Fat
                    </span>
                    <span style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: 'rgb(39, 39, 42)'
                    }}>
                      {Math.round(meal.nutrition.fat / baseServings)}g
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leave a Note Section */}
        <div className="mt-16 max-w-4xl">
          <h2 style={{
            fontFamily: '"Right Grotesk Spatial", sans-serif',
            fontWeight: 500,
            fontSize: '30px',
            lineHeight: '36px',
            color: 'rgb(39, 39, 42)',
            marginBottom: '24px'
          }}>
            Leave a note
          </h2>

          <div className="mb-12 p-6 bg-white border-2 border-gray-200" style={{ borderRadius: '33px' }}>
            <textarea
              placeholder="Tell us what you think..."
              rows={4}
              className="w-full resize-none outline-none"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '15px',
                color: 'rgb(39, 39, 42)',
                border: 'none',
                padding: 0
              }}
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <button
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
                style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontSize: '14px'
                }}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p style={{
            fontFamily: '"General Sans", sans-serif',
            fontSize: '15px',
            color: 'rgb(82, 82, 91)',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            You need to be logged in to add a note
          </p>

          {/* Notes Section */}
          <h3 style={{
            fontFamily: '"Right Grotesk Spatial", sans-serif',
            fontWeight: 500,
            fontSize: '30px',
            lineHeight: '36px',
            color: 'rgb(39, 39, 42)',
            marginBottom: '24px'
          }}>
            Notes (2)
          </h3>

          <div className="space-y-6">
            {/* Comment 1 */}
            <div className="pb-6 border-b border-gray-200">
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 flex items-center justify-center bg-black text-white"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    fontSize: '18px',
                    fontWeight: 500
                  }}
                >
                  R
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: 'rgb(39, 39, 42)'
                    }}>
                      Ryan J.
                    </span>
                    <span style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: '14px',
                      color: 'rgb(120, 120, 120)'
                    }}>
                      a month ago
                    </span>
                  </div>
                  <p style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: '15px',
                    lineHeight: '21px',
                    color: 'rgb(39, 39, 42)',
                    marginBottom: '12px'
                  }}>
                    soo good!!
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span style={{
                        fontFamily: '"General Sans", sans-serif',
                        fontSize: '14px'
                      }}>
                        0
                      </span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span style={{
                        fontFamily: '"General Sans", sans-serif',
                        fontSize: '14px'
                      }}>
                        Reply
                      </span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment 2 */}
            <div className="pb-6 border-b border-gray-200">
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 flex items-center justify-center bg-black text-white"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    fontSize: '18px',
                    fontWeight: 500
                  }}
                >
                  D
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: 'rgb(39, 39, 42)'
                    }}>
                      Duyen L.
                    </span>
                    <span style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: '14px',
                      color: 'rgb(120, 120, 120)'
                    }}>
                      2 months ago
                    </span>
                  </div>
                  <p style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: '15px',
                    lineHeight: '21px',
                    color: 'rgb(39, 39, 42)',
                    marginBottom: '12px'
                  }}>
                    my gf loves this. me too ofc
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span style={{
                        fontFamily: '"General Sans", sans-serif',
                        fontSize: '14px'
                      }}>
                        1
                      </span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span style={{
                        fontFamily: '"General Sans", sans-serif',
                        fontSize: '14px'
                      }}>
                        Reply
                      </span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}