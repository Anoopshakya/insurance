import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";

const schema = z.object({
  productType: z.enum(["health", "motor", "term"]),
  customerName: z.string().trim().min(2, "Enter your full name").max(100),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  selections: z.record(z.string(), z.string().trim().min(1).max(100)),
  website: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    const { data, error } = await supabaseServer()
      .from("website_quote_requests")
      .insert({
        product_type: input.productType,
        customer_name: input.customerName,
        mobile: input.mobile,
        selections: input.selections,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Check your details" },
        { status: 400 },
      );
    }
    console.error("Quote request submission failed", error);
    return NextResponse.json(
      { error: "Unable to submit your request. Please try again." },
      { status: 500 },
    );
  }
}
