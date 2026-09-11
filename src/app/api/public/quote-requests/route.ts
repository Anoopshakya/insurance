import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";

import { quoteRequestSchema } from "@/lib/quote-request";

export async function POST(request: NextRequest) {
  try {
    const input = quoteRequestSchema.parse(await request.json());
    const { data, error } = await supabaseServer()
      .from("website_quote_requests")
      .insert({
        product_type: input.productType,
        customer_name: input.customerName,
        mobile: input.mobile,
        selections: { ...input.selections, ...(input.email ? { email: input.email } : {}) },
        source: input.sourcePath ? `website:${input.sourcePath}` : "homepage_quote_widget",
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
