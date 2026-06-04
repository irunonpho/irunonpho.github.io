export interface PortfolioItem {
  title: string;
  description: string;
  tags: string[];
  // Place images in public/portfolio/ and reference as "/portfolio/filename.jpg"
  image?: string;
  // Shown as background when image is missing or not yet added
  placeholder: string;
  link?: string;
}

export const portfolio: PortfolioItem[] = [
  {
    title: "Agent Assist",
    description: "Built-in live call transcription providing real-time intent detection for CSR enablement.",
    tags: ["React", "Java", "PubNub"],
    image: "/portfolio/agent-assist.webp",
    placeholder: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
  },
  {
    title: "AI Insights",
    description: "Powerful call analytics insights delivered in a single dashboard.",
    tags: ["Python", "Big Query", "GCP"],
    image: "/portfolio/ai-insights.webp",
    placeholder: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
  },
  {
    title: "GenAI Studio",
    description: "Completely customizable human interactions powered by LLM's.",
    tags: ["Google Gemini", "Google Datastore", "gRPC"],
    image: "/portfolio/genai-studio.webp",
    placeholder: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
  },
];
