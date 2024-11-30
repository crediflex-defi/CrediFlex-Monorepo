import { NextResponse } from "next/server";

export async function GET() {
  // Handle GET request
  try {
    const fetchedData = await fetch("https://crediflex-avs.vercel.app/process");
    const data = await fetchedData.json();

    return NextResponse.json({ message: "Done", data });
  } catch (error) {
    return NextResponse.json({ message: "Error", error });
  }
}
