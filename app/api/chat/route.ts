import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set" },
        { status: 500 }
      );
    }

    // Get the model - Gemini 2.5 Flash
    // Note: If "gemini-2.0-flash-exp" doesn't work, try "gemini-1.5-flash" or "gemini-1.5-flash-latest"
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest" 
    });

    // Convert messages to Gemini format
    const chatHistory = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // All messages except the last one
    });

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: "Failed to get response from Gemini" },
      { status: 500 }
    );
  }
}

