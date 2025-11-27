export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 mb-6 text-sm font-medium bg-green-500/20 text-green-400 rounded-full">
            🚀 AI-Powered Monetization
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Turn Your Side Project Into Revenue
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Monetizer analyzes your codebase, identifies monetization opportunities,
            and generates a complete strategy using AI. From open source to SaaS in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <code className="px-6 py-3 bg-gray-800 rounded-lg text-green-400 font-mono">
              npx @monetizer/cli analyze
            </code>
            <a
              href="#pricing"
              className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition"
            >
              View Pricing →
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-800 rounded-xl">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">1. Analyze</h3>
              <p className="text-gray-400">
                Run the CLI in your project. We scan your codebase, tech stack,
                dependencies, and structure to understand what you&apos;ve built.
              </p>
            </div>
            <div className="p-6 bg-gray-800 rounded-xl">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-2">2. Strategize</h3>
              <p className="text-gray-400">
                Claude AI generates a custom monetization strategy with pricing tiers,
                implementation phases, and market research.
              </p>
            </div>
            <div className="p-6 bg-gray-800 rounded-xl">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">3. Execute</h3>
              <p className="text-gray-400">
                Get a step-by-step plan with code snippets for payment integration,
                feature gating, and go-to-market launch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-gray-400 text-center mb-12">Start free, upgrade when you need more</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="p-8 bg-gray-800 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">$0</div>
              <p className="text-gray-400 mb-6">Perfect for trying it out</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Core CLI features
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> 10 analyses/month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Basic strategy generation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Community support
                </li>
              </ul>
              <button className="w-full py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition">
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 bg-gradient-to-b from-green-900/50 to-gray-800 rounded-xl border-2 border-green-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-sm font-semibold rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-1">$12<span className="text-lg font-normal text-gray-400">/mo</span></div>
              <p className="text-gray-400 mb-6">or $96/year (2 months free)</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Unlimited analyses
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Market research (Perplexity)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Advanced strategies
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Priority support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> GTM launch plans
                </li>
              </ul>
              <a
                href="https://buy.lemonsqueezy.com/checkout/buy/monetizer-pro"
                className="block w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg text-center font-semibold transition"
              >
                Upgrade to Pro
              </a>
            </div>

            {/* Team Tier */}
            <div className="p-8 bg-gray-800 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold mb-2">Team</h3>
              <div className="text-4xl font-bold mb-1">$25<span className="text-lg font-normal text-gray-400">/seat/mo</span></div>
              <p className="text-gray-400 mb-6">3 seat minimum</p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Seat management
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> SSO (Google OAuth)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Audit logs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Dedicated support
                </li>
              </ul>
              <button className="w-full py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Section */}
      <section className="px-6 py-20 bg-gray-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Get Started in Seconds</h2>
          <div className="bg-gray-900 rounded-xl p-6 font-mono text-left">
            <div className="text-gray-500 mb-2"># Install and run</div>
            <div className="text-green-400 mb-4">$ npx @monetizer/cli analyze</div>
            <div className="text-gray-500 mb-2"># Generate strategy</div>
            <div className="text-green-400 mb-4">$ npx @monetizer/cli strategy</div>
            <div className="text-gray-500 mb-2"># Launch with GTM plan</div>
            <div className="text-green-400">$ npx @monetizer/cli gtm</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-400">
            © 2025 Monetizer. Built with AI.
          </div>
          <div className="flex gap-6 text-gray-400">
            <a href="https://github.com/anombyte93/monetizer" className="hover:text-white transition">
              GitHub
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing
            </a>
            <a href="mailto:support@monetizer.dev" className="hover:text-white transition">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
