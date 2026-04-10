import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { csvQuestionSchema } from "@/lib/validators";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found" }, { status: 400 });
  }

  const results: { row: number; success: boolean; error?: string }[] = [];
  const validQuestions: {
    host_id: string;
    text: string;
    answer: string;
    answer_type: string;
    choices: string[] | null;
    category: string;
    difficulty: string;
    points: number;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = csvQuestionSchema.safeParse(rows[i]);
    if (!parsed.success) {
      results.push({
        row: i + 2, // 1-indexed + header row
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      });
      continue;
    }

    const { text: qText, answer, answer_type, choices, category, difficulty, points } =
      parsed.data;

    validQuestions.push({
      host_id: user.id,
      text: qText,
      answer,
      answer_type,
      choices: choices ? choices.split("|").map((c) => c.trim()) : null,
      category,
      difficulty,
      points: typeof points === "number" ? points : parseInt(String(points), 10) || 1,
    });
    results.push({ row: i + 2, success: true });
  }

  if (validQuestions.length > 0) {
    const { error: insertError } = await supabase
      .from("questions")
      .insert(validQuestions);

    if (insertError) {
      return NextResponse.json(
        { error: "Database insert failed: " + insertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    imported: validQuestions.length,
    failed: results.filter((r) => !r.success).length,
    total: rows.length,
    details: results,
  });
}
