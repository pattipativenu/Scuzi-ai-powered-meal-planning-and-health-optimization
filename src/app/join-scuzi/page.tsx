import Link from "next/link";

export default function JoinScuziPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Welcome Message */}
        <div className="space-y-4">
          <h1 
            className="font-medium leading-tight"
            style={{
              fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
              fontStyle: "normal",
              fontWeight: 500,
              fontSize: "clamp(32px, 5vw, 48px)",
              lineHeight: "1.2",
              color: "rgb(0, 0, 0)"
            }}
          >
            Welcome to SCUZI!
          </h1>
          <p 
            className="leading-relaxed max-w-xl mx-auto"
            style={{
              fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
              fontStyle: "normal",
              fontWeight: 500,
              fontSize: "clamp(18px, 3vw, 24px)",
              lineHeight: "1.5",
              color: "rgb(0, 0, 0)"
            }}
          >
            Your personalized meal journey begins here. We'll ask a few quick questions to tailor your nutrition experience.
          </p>
        </div>

        {/* Start Button */}
        <Link
          href="/"
          className="inline-block px-12 py-4 rounded-lg text-white font-medium transition-transform hover:scale-105 shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgb(255, 87, 34), rgb(76, 175, 80))",
            fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
            fontWeight: 500,
            fontSize: "clamp(18px, 3vw, 24px)"
          }}
        >
          Start
        </Link>

        {/* Additional Info */}
        <p 
          className="text-sm opacity-70"
          style={{
            fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
            fontWeight: 500
          }}
        >
          The next version will include personalized question logic.
        </p>
      </div>
    </div>
  );
}