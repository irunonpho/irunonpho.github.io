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
    description: "Production system serving enterprise contact centers — real-time transcription + LLM-powered intent detection that surfaces agent prompts mid-call. Built on Deepgram + PubNub, processing live audio at scale",
    tags: ["Real-Time Transcription", "Intent Detection"],
    image: "/portfolio/agent-assist.webp",
    placeholder: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
  },
  {
    title: "AI Insights",
    description: "Powerful call analytics insights delivered in a single dashboard backed by Google BigQuery.",
    tags: ["ETL", "Analytics"],
    image: "/portfolio/ai-insights.webp",
    placeholder: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
  },
  {
    title: "GenAI Studio",
    description: "Customer-facing LLM configuration platform built on Google Gemini — enables enterprise clients to define prompt strategies, knowledge context, and agent behavior without engineering involvement. Built with Google Datastore + gRPC at scale",
    tags: ["LLM platform", "Customer-Configurable"],
    image: "/portfolio/genai-studio.webp",
    placeholder: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
  },
];
