"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionBankPanel } from "@/components/builder/QuestionBankPanel";
import type { AnswerType, Difficulty } from "@/types/game";

export default function QuestionsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setShowForm(false);
    setRefreshKey((k) => k + 1);
  };

  const handleImported = () => {
    setShowImport(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 text-sm text-text-mid hover:text-text"
        >
          &larr; Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-accent">Question Bank</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowImport(!showImport);
                setShowForm(false);
              }}
            >
              Import CSV
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowForm(!showForm);
                setShowImport(false);
              }}
            >
              + New Question
            </Button>
          </div>
        </div>
      </div>

      {showImport && <ImportForm onDone={handleImported} />}
      {showForm && <QuestionForm onDone={handleCreated} />}

      <div key={refreshKey}>
        <QuestionBankPanel />
      </div>
    </div>
  );
}

function QuestionForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerType, setAnswerType] = useState<AnswerType>("free-text");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [category, setCategory] = useState("General");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [points, setPoints] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      text,
      answer,
      answer_type: answerType,
      category,
      difficulty,
      points,
    };

    if (answerType === "mc") {
      body.choices = choices.filter((c) => c.trim());
    }

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create question");
      setSaving(false);
      return;
    }

    onDone();
  };

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold">New Question</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-mid">Question</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={2}
            className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none focus:border-accent"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-mid">
              Answer Type
            </span>
            <select
              value={answerType}
              onChange={(e) => setAnswerType(e.target.value as AnswerType)}
              className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none"
            >
              <option value="free-text">Free Text</option>
              <option value="mc">Multiple Choice</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-mid">Answer</span>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none focus:border-accent"
            />
          </label>
        </div>

        {answerType === "mc" && (
          <div className="grid grid-cols-2 gap-3">
            {choices.map((choice, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                value={choice}
                onChange={(e) => {
                  const updated = [...choices];
                  updated[i] = e.target.value;
                  setChoices(updated);
                }}
                className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none focus:border-accent"
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-mid">Category</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-mid">
              Difficulty
            </span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-mid">Points</span>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)}
              className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none focus:border-accent"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} size="sm">
            {saving ? "Creating..." : "Create Question"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDone()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ImportForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    failed: number;
    total: number;
    details: { row: number; success: boolean; error?: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/questions/import", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Import failed");
      setImporting(false);
      return;
    }

    const data = await res.json();
    setResult(data);
    setImporting(false);
  }, [file]);

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold">Import from CSV</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {result ? (
        <div className="grid gap-3">
          <div className="rounded-lg bg-correct/10 px-4 py-3 text-sm text-correct">
            Imported {result.imported} of {result.total} questions.
            {result.failed > 0 && (
              <span className="text-danger">
                {" "}
                {result.failed} failed.
              </span>
            )}
          </div>
          {result.details
            .filter((d) => !d.success)
            .map((d) => (
              <div
                key={d.row}
                className="text-xs text-danger"
              >
                Row {d.row}: {d.error}
              </div>
            ))}
          <Button size="sm" onClick={onDone}>
            Done
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-text-mid">
            CSV format: text, answer, answer_type, choices (pipe-separated),
            category, difficulty, points
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-text-mid file:mr-3 file:rounded-md file:border-0 file:bg-surface-hi file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
          />
          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              size="sm"
            >
              {importing ? "Importing..." : "Import"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
