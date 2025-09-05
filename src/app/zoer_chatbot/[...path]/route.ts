import { NextRequest, NextResponse } from "next/server";

// Zoer chatbot is disabled - we're only using GitHub + Supabase + Railway stack
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Zoer chatbot service is not configured" },
    { status: 404 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Zoer chatbot service is not configured" },
    { status: 404 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: "Zoer chatbot service is not configured" },
    { status: 404 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: "Zoer chatbot service is not configured" },
    { status: 404 }
  );
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { error: "Zoer chatbot service is not configured" },
    { status: 404 }
  );
}
