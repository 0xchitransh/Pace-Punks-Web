import { NextRequest, NextResponse } from "next/server";
import { addWaitlistEntry, getWaitlistEntry } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, walletAddress } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { entry, isNew } = await addWaitlistEntry({
      email,
      walletAddress,
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      isNew,
      entry: {
        email: entry.email,
        queueNumber: entry.queueNumber,
        createdAt: entry.createdAt,
      },
    });
  } catch (error) {
    console.error("Waitlist API POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter required" },
        { status: 400 }
      );
    }

    const entry = await getWaitlistEntry(email);

    if (!entry) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      entry: {
        email: entry.email,
        queueNumber: entry.queueNumber,
        createdAt: entry.createdAt,
      },
    });
  } catch (error) {
    console.error("Waitlist API GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
