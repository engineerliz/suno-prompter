import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set. Please create a .env.local file with your API key." },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Get the model - Gemini 2.5 Flash
    // Common working model names: gemini-pro, gemini-1.5-pro-latest, gemini-1.5-flash-001
    // For Gemini 2.5 Flash, try: gemini-2.0-flash-exp or gemini-1.5-flash-001
    const modelName = process.env.GEMINI_MODEL || "gemini-pro";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Convert messages to Gemini format
    const chatHistory = messages
      .slice(0, -1) // All messages except the last one
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    // Start chat with history (if any)
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    // Provide more detailed error messages
    let errorMessage = "Failed to get response from Gemini";
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

