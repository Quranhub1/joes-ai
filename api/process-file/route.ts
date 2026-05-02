import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const prompt = formData.get('prompt') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Upload file to Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const uploadResult = await genAI.uploadFile(file);
    
    const result = await model.generateContent([
      `Analyze this file: ${prompt}`,
      { fileData: { fileUri: uploadResult.file.uri, mimeType: file.type } }
    ]);

    return NextResponse.json({ response: result.response.text() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}