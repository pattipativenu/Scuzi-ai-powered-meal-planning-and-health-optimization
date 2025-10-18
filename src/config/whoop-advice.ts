/**
 * WHOOP Health Advice Configuration
 * Dynamic health messages based on real WHOOP metrics from AWS RDS
 */

export interface HealthAdviceRule {
  metric: string;
  condition: (value: number) => boolean;
  messages: string[];
}

export const healthAdviceRules: HealthAdviceRule[] = [
  // Sleep Debt
  {
    metric: "sleep_debt",
    condition: (value) => value > 60,
    messages: [
      "You've been short on rest — try to squeeze in 6 hours tonight.",
      "Sleep debt detected — your body needs recovery time.",
      "Running low on sleep — prioritize rest this week.",
    ],
  },
  // Recovery Score
  {
    metric: "recovery_score",
    condition: (value) => value < 50,
    messages: [
      "Your recovery is low — take it easy today and stay hydrated.",
      "Low recovery detected — focus on rest and nutrition.",
      "Your body needs a break — gentle activities only today.",
    ],
  },
  // Energy Burned
  {
    metric: "energy_burned",
    condition: (value) => value > 3000,
    messages: [
      "🔥 Big burn rate! Make sure you fuel up with all 3 meals.",
      "High energy output — your meals need to match that effort.",
      "You're burning through calories — let's build a solid fuel plan.",
    ],
  },
  // Heart Rate Variability
  {
    metric: "heart_rate_variability",
    condition: (value) => value < 30,
    messages: [
      "Your HRV is dipping — a few deep breaths can help balance things.",
      "Low HRV detected — stress management is key right now.",
      "Your nervous system needs support — focus on calm activities.",
    ],
  },
  // Sleep Consistency
  {
    metric: "sleep_consistency",
    condition: (value) => value < 80,
    messages: [
      "Consistency builds recovery — aim for regular sleep times.",
      "Your sleep schedule is off — try going to bed at the same time.",
      "Sleep consistency matters — your body craves routine.",
    ],
  },
  // Average Heart Rate
  {
    metric: "average_heart_rate",
    condition: (value) => value > 85,
    messages: [
      "Your heart's been working hard — remember to rest well.",
      "Elevated heart rate detected — prioritize recovery today.",
      "High heart rate average — your body is in overdrive mode.",
    ],
  },
  // Sleep Performance
  {
    metric: "sleep_performance",
    condition: (value) => value < 70,
    messages: [
      "Sleep quality is down — try winding down earlier tonight.",
      "Your sleep efficiency needs work — create a bedtime routine.",
      "Not sleeping well? Let's optimize your recovery tonight.",
    ],
  },
  // Day Strain
  {
    metric: "day_strain",
    condition: (value) => value > 15,
    messages: [
      "💪 High strain day — your nutrition needs to match your effort.",
      "You pushed hard today — recovery meals are crucial.",
      "Big strain detected — let's fuel your recovery properly.",
    ],
  },
  // Resting Heart Rate
  {
    metric: "resting_heart_rate",
    condition: (value) => value > 70,
    messages: [
      "Elevated resting HR — your body might need more rest.",
      "High resting heart rate — focus on recovery and hydration.",
      "Your heart rate is up — take it easy and recharge.",
    ],
  },
];

export const defaultMessages = [
  "Creating your personalized meal plan with AI...",
  "Analyzing your recovery and energy needs...",
  "Building meals that match your body's rhythm...",
  "Optimizing nutrition for your lifestyle...",
  "Crafting meals to support your goals...",
];

export const successMessages = [
  "✅ Your personalized meal plan is ready! Let's fuel up smart this week.",
  "✅ All set! Your body-aware meal plan is ready to go.",
  "✅ Done! Your meals are optimized for your health data.",
];