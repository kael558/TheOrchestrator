import React, { useState } from "react";
import { Link } from "react-router-dom";

import {
	ChartBarIcon,
	CogIcon,
	ShieldCheckIcon,
	LightningBoltIcon,
	CurrencyDollarIcon,
	CheckIcon,
	ArrowRightIcon,
	BeakerIcon,
	ClockIcon,
	EyeIcon,
	ScissorsIcon,
	SparklesIcon,
} from "@heroicons/react/outline";

const Landing = () => {
	const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleWaitlistSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) return;

		setIsSubmitting(true);

		try {
			const data = new FormData();
			data.append("email", email);
			data.append("date", new Date().toISOString());
			data.append("sheetName", "TheOrch_EmailList");

			const response = await fetch(
				"https://script.google.com/macros/s/AKfycbzUnCt-XonKsqeYtquXUtLduIdKkmxm01ZBKwuh9K2KyJ6MH-96rTpFC4kMy5jEVvaI/exec",
				{
					method: "POST",
					body: data,
				}
			);

			if (!response.ok) {
				console.error("Error submitting email");
				return;
			}

			console.log("Email submitted successfully");

			setIsSubmitted(true);
			setEmail("");
		} catch (error) {
			console.error("Failed to submit to waitlist:", error);
			// You could add error state handling here if needed
		} finally {
			setIsSubmitting(false);
		}
	};

	const features = [
		{
			icon: BeakerIcon,
			title: "Input-Output Testing",
			description:
				"Simply provide input-output pairs and let OptiTune handle the rest. No complex prompt engineering required.",
		},
		{
			icon: CogIcon,
			title: "Automated System Prompts",
			description:
				"Our AI automatically generates optimal system prompts and code based on your test cases.",
		},
		{
			icon: CurrencyDollarIcon,
			title: "Cost Optimization",
			description:
				"Automatically selects the best model balancing accuracy and pricing so you never overpay.",
		},
		{
			icon: ShieldCheckIcon,
			title: "Quality Monitoring",
			description:
				"Continuous monitoring detects model downgrades and automatically switches or fixes issues.",
		},
		{
			icon: LightningBoltIcon,
			title: "Simple API",
			description:
				"One endpoint, just like any LLM API. Send parameters, get responses. No complexity.",
		},
		{
			icon: ChartBarIcon,
			title: "Performance Tracking",
			description:
				"Track accuracy, cost, and performance across all your tests and model iterations.",
		},
	];

	const benefits = [
		"Stop overpaying for premium models when cheaper ones work just as well",
		"Get notified instantly when LLM providers secretly downgrade models",
		"Automatic failover and model switching keeps your app running smoothly",
		"Historical test tracking prevents regression and maintains quality",
		"Zero prompt engineering - just provide examples and get results",
		"One API endpoint replaces complex model management",
	];

	const promptEngineeringComparisons = [
		{
			traditional: "Hours spent crafting the perfect prompt",
			orchestrator:
				"Provide examples, get optimized prompts automatically",
		},
		{
			traditional: "Trial and error with different phrasings",
			orchestrator: "AI generates and tests multiple prompt variations",
		},
		{
			traditional: "Manual A/B testing of prompt performance",
			orchestrator: "Continuous optimization based on real usage data",
		},
		{
			traditional: "Breaking prompts when switching models",
			orchestrator: "Model-specific prompt optimization automatically",
		},
		{
			traditional: "Maintaining prompt libraries and versions",
			orchestrator: "Version control and rollback built-in",
		},
	];

	const testimonials = [
		{
			quote: "TheOrchestrator saved us $2,000/month by automatically switching from GPT-4 to Claude when accuracy was identical. The monitoring caught a model downgrade that would have broken our app.",
			author: "Sarah Chen",
			title: "CTO, DataFlow Inc",
		},
		{
			quote: "Finally, an LLM service that actually optimizes for both cost and quality. The automatic prompt generation from our test cases is incredible.",
			author: "Marcus Rodriguez",
			title: "Lead Developer, TechStart",
		},
		{
			quote: "The peace of mind knowing that model downgrades are automatically detected and fixed is worth the price alone. Our uptime has never been better.",
			author: "Emily Watson",
			title: "Engineering Manager, CloudTech",
		},
	];

	return (
		<div className="min-h-screen bg-white">
			{/* Navigation */}
			<nav className="bg-white shadow-sm border-b">
				<div className="container mx-auto px-6 py-4">
					<div className="flex justify-between items-center">
						<div className="text-2xl font-bold text-gray-900">
							The
							<span className="text-primary">Orchestrator</span>
						</div>
						<div className="flex space-x-4">
							<Link
								to="/login"
								className="text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors"
							>
								Sign In
							</Link>
							<Link to="/register" className="btn-primary">
								Get Started
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
				<div className="container mx-auto px-6 text-center">
					<h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
						Stop Overpaying for
						<span className="text-primary block">LLM APIs</span>
					</h1>
					<p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
						TheOrchestrator automatically optimizes your LLM usage
						by selecting the best model for accuracy and cost,
						monitoring for downgrades, and maintaining quality - all
						through one simple API.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<form
							onSubmit={handleWaitlistSubmit}
							className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
						>
							<input
								type="email"
								placeholder="Enter your email for golden waitlist access"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="px-6 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-80"
								required
								disabled={isSubmitting}
							/>
							<button
								type="submit"
								disabled={isSubmitting || isSubmitted}
								className="bg-primary text-white px-8 py-3 text-lg font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center justify-center whitespace-nowrap disabled:opacity-50"
							>
								{isSubmitting ? (
									"Joining..."
								) : isSubmitted ? (
									<>
										<CheckIcon className="w-5 h-5 mr-2" />
										Welcome to Golden Waitlist!
									</>
								) : (
									<>
										Join Golden Waitlist
										<SparklesIcon className="w-5 h-5 ml-2" />
									</>
								)}
							</button>
						</form>
					</div>
					{isSubmitted && (
						<p className="text-green-600 mt-4 animate-fadeIn">
							🎉 You're on the golden waitlist! Get ready for
							exclusive early access to TheOrchestrator.
						</p>
					)}
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20">
				<div className="container mx-auto px-6">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-gray-900 mb-4">
							How TheOrchestrator Works
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							From input-output pairs to production-ready API in
							minutes
						</p>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<div
								key={index}
								className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
							>
								<feature.icon className="w-12 h-12 text-primary mb-4" />
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{feature.title}
								</h3>
								<p className="text-gray-600">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Cut Prompt Engineering Section */}
			<section className="py-20 bg-gradient-to-br from-red-50 to-orange-50">
				<div className="container mx-auto px-6">
					<div className="text-center mb-16">
						<div className="flex justify-center items-center mb-4">
							<ScissorsIcon className="w-12 h-12 text-red-500 mr-4" />
							<h2 className="text-4xl font-bold text-gray-900">
								Cut Through Prompt Engineering
							</h2>
						</div>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							Stop wasting hours on prompt crafting.
							TheOrchestrator eliminates the guesswork and
							automates the entire prompt optimization process.
						</p>
					</div>

					<div className="max-w-5xl mx-auto">
						<div className="grid lg:grid-cols-2 gap-8 mb-12">
							<div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-red-500">
								<h3 className="text-2xl font-bold text-red-600 mb-6 flex items-center">
									<span className="text-3xl mr-3">❌</span>
									Traditional Prompt Engineering
								</h3>
								<ul className="space-y-4">
									{promptEngineeringComparisons.map(
										(item, index) => (
											<li
												key={index}
												className="flex items-start"
											>
												<span className="text-red-500 mr-3 mt-1">
													•
												</span>
												<span className="text-gray-700">
													{item.traditional}
												</span>
											</li>
										)
									)}
								</ul>
							</div>

							<div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-green-500">
								<h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
									<span className="text-3xl mr-3">✅</span>
									TheOrchestrator Way
								</h3>
								<ul className="space-y-4">
									{promptEngineeringComparisons.map(
										(item, index) => (
											<li
												key={index}
												className="flex items-start"
											>
												<span className="text-green-500 mr-3 mt-1">
													•
												</span>
												<span className="text-gray-700">
													{item.orchestrator}
												</span>
											</li>
										)
									)}
								</ul>
							</div>
						</div>

						<div className="bg-gradient-to-r from-primary to-primary-dark text-white p-8 rounded-xl text-center">
							<h3 className="text-3xl font-bold mb-4">
								From Weeks to Minutes
							</h3>
							<p className="text-xl opacity-90 mb-6">
								What used to take weeks of prompt engineering
								now happens automatically in minutes.
							</p>
							<div className="flex justify-center items-center space-x-8 text-lg">
								<div className="text-center">
									<div className="text-3xl font-bold">
										95%
									</div>
									<div className="opacity-75">Time Saved</div>
								</div>
								<div className="text-center">
									<div className="text-3xl font-bold">3x</div>
									<div className="opacity-75">
										Better Results
									</div>
								</div>
								<div className="text-center">
									<div className="text-3xl font-bold">
										Zero
									</div>
									<div className="opacity-75">
										Manual Work
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className="py-20 bg-gray-50">
				<div className="container mx-auto px-6">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div>
							<h2 className="text-4xl font-bold text-gray-900 mb-6">
								Why Developers Choose TheOrchestrator
							</h2>
							<div className="space-y-4">
								{benefits.map((benefit, index) => (
									<div
										key={index}
										className="flex items-start"
									>
										<CheckIcon className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
										<p className="text-gray-700">
											{benefit}
										</p>
									</div>
								))}
							</div>
						</div>
						<div className="bg-white p-8 rounded-xl shadow-lg">
							<h3 className="text-2xl font-semibold text-gray-900 mb-4">
								<ClockIcon className="w-8 h-8 text-primary inline mr-3" />
								Save Time & Money
							</h3>
							<div className="space-y-6">
								<div className="flex justify-between items-center">
									<span className="text-gray-600">
										Manual model management
									</span>
									<span className="text-red-500 font-semibold">
										20+ hours/month
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-600">
										Model downgrade detection
									</span>
									<span className="text-red-500 font-semibold">
										Days to notice
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-600">
										Cost optimization
									</span>
									<span className="text-red-500 font-semibold">
										Manual analysis
									</span>
								</div>
								<hr />
								<div className="flex justify-between items-center text-lg">
									<span className="text-gray-900 font-semibold">
										With TheOrchestrator
									</span>
									<span className="text-green-500 font-bold">
										Fully Automated
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="py-20 bg-gray-50">
				<div className="container mx-auto px-6">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-gray-900 mb-4">
							Trusted by Developers Worldwide
						</h2>
					</div>
					<div className="grid md:grid-cols-3 gap-8">
						{testimonials.map((testimonial, index) => (
							<div
								key={index}
								className="bg-white p-6 rounded-xl shadow-sm"
							>
								<p className="text-gray-700 mb-4 italic">
									"{testimonial.quote}"
								</p>
								<div>
									<p className="font-semibold text-gray-900">
										{testimonial.author}
									</p>
									<p className="text-gray-600 text-sm">
										{testimonial.title}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 bg-primary">
				<div className="container mx-auto px-6 text-center">
					<h2 className="text-4xl font-bold text-white mb-4">
						Ready to Optimize Your LLM Costs?
					</h2>
					<p className="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">
						Join the golden waitlist and be among the first to
						experience intelligent LLM optimization with exclusive
						early access.
					</p>
					<form
						onSubmit={handleWaitlistSubmit}
						className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto"
					>
						<input
							type="email"
							placeholder="Your email for golden waitlist"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="px-6 py-3 text-lg border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent w-full"
							required
							disabled={isSubmitting}
						/>
						<button
							type="submit"
							disabled={isSubmitting || isSubmitted}
							className="bg-white text-primary px-8 py-3 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center whitespace-nowrap disabled:opacity-50"
						>
							{isSubmitting ? (
								"Joining..."
							) : isSubmitted ? (
								<>
									<CheckIcon className="w-5 h-5 mr-2" />
									Welcome!
								</>
							) : (
								<>
									Join Golden Waitlist
									<SparklesIcon className="w-5 h-5 ml-2" />
								</>
							)}
						</button>
					</form>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white py-12">
				<div className="container mx-auto px-6">
					<div className="grid md:grid-cols-4 gap-8">
						<div>
							<div className="text-2xl font-bold mb-4">
								The
								<span className="text-primary">
									Orchestrator
								</span>
							</div>
							<p className="text-gray-400">
								Intelligent LLM optimization for modern
								developers.
							</p>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Product</h3>
							<ul className="space-y-2 text-gray-400">
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Features
									</a>
								</li>
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										API Reference
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Company</h3>
							<ul className="space-y-2 text-gray-400">
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										About
									</a>
								</li>
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Blog
									</a>
								</li>
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Careers
									</a>
								</li>
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Contact
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Support</h3>
							<ul className="space-y-2 text-gray-400">
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Help Center
									</a>
								</li>
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Community
									</a>
								</li>
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Status
									</a>
								</li>
								<li>
									<a
										href="#"
										className="hover:text-white transition-colors"
									>
										Security
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
						<p>&copy; 2025 TheOrchestrator. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Landing;
