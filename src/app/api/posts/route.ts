import { NextResponse } from "next/server";

// Mock data - in a real app, this would be a database call
const posts = [
  {
    id: 1,
    title: "Getting Started with Next.js",
    content:
      "Learn how to build modern web applications with Next.js, React, and TypeScript.",
    publishedAt: "2025-08-01T10:00:00Z",
  },
  {
    id: 2,
    title: "Understanding ISG in Next.js",
    content:
      "A deep dive into Incremental Static Regeneration and how it can improve your Next.js apps.",
    publishedAt: "2025-08-05T15:30:00Z",
  },
  {
    id: 3,
    title: "Building a Blog with Next.js",
    content:
      "Step-by-step guide to building a modern blog with Next.js and Markdown.",
    publishedAt: "2025-08-10T09:15:00Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Simulate database delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (id) {
    const post = posts.find((p) => p.id === Number(id));
    if (!post) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.json(post);
  }

  return NextResponse.json(posts);
}
