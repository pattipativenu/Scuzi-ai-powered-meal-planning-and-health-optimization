import { User, Mail, Bell, Shield, CreditCard, LogOut } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Account</h1>
          <p className="text-lg text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">John Doe</h2>
              <p className="text-muted-foreground">john.doe@example.com</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">
            Edit Profile
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Email Preferences */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Email Preferences</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Manage how you receive notifications and updates from MealPrep.
            </p>
            <button className="text-primary hover:underline text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Notifications</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Control which notifications you receive and when.
            </p>
            <button className="text-primary hover:underline text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Privacy & Security */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Privacy & Security</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Manage your data privacy settings and security preferences.
            </p>
            <button className="text-primary hover:underline text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Subscription */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Subscription & Billing</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              View your subscription plan and manage billing information.
            </p>
            <button className="text-primary hover:underline text-sm font-medium">
              Coming Soon
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8 pt-8 border-t border-border">
          <button className="flex items-center gap-2 text-destructive hover:underline font-medium">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-secondary/50 rounded-lg p-6 text-center">
          <h3 className="font-semibold mb-2">User Profile Management Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            We're working on bringing you comprehensive account management features. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
}