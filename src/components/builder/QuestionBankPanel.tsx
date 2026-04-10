"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import type { Question } from "@/types/game";

interface QuestionBankPanelProps {
  /** When set, questions can be selected (e.g., for adding to a round) */
  onSelect?: (question: Question) => void;
  /** IDs of questions already added (shown with a checkmark) */
  excludeIds?: Set<string>;
  /** Compact mode for embedding in game builder */
  compact?: boolean;
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const ANSWER_TYPES = ["free-text", "mc"] as const;

export function QuestionBankPanel({
  onSelect,
  excludeIds,
  compact = false,
}: QuestionBankPanelProps) {
  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [answerType, setAnswerType] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const perPage = compact ? 20 : 50;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (difficulty) params.set("difficulty", difficulty);
    if (answerType) params.set("answer_type", answerType);
    params.set("page", page.toString());
    params.set("per_page", perPage.toString());
    params.set("sort_by", "created_at");
    params.set("sort_dir", "desc");

    const res = await fetch(`/api/questions?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions);
      setTotal(data.total);
    }
    setLoading(false);
  }, [search, category, difficulty, answerType, page, perPage]);

  const fetchCategories = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("questions")
      .select("category")
      .eq("host_id", user.id);

    if (data) {
      const unique = [...new Set(data.map((q) => q.category))].sort();
      setCategories(unique);
    }
  }, [supabase]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = Math.ceil(total / perPage);

  const difficultyColor = (d: string) => {
    if (d === "Easy") return { color: "#22c985", bg: "#22c98520" };
    if (d === "Hard") return { color: "#ef4444", bg: "#ef444420" };
    return { color: "#e8b931", bg: "#e8b93120" };
  };

  return (
    <div className={compact ? "" : ""}>
      {/* Filters */}
      <div className={`flex flex-wrap gap-2 ${compact ? "mb-3" : "mb-4"}`}>
        <input
          type="text"
          placeholder="Search questions..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={`flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent ${compact ? "min-w-[140px]" : "min-w-[200px]"}`}
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text outline-none"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={answerType}
          onChange={(e) => {
            setAnswerType(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text outline-none"
        >
          <option value="">All Types</option>
          {ANSWER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "mc" ? "Multiple Choice" : "Free Text"}
            </option>
          ))}
        </select>
      </div>

      {/* Question list */}
      {loading ? (
        <div className="py-8 text-center text-text-mid">Loading...</div>
      ) : questions.length === 0 ? (
        <div className="py-8 text-center text-text-mid">No questions found</div>
      ) : (
        <div className="flex flex-col gap-2">
          {questions.map((q) => {
            const excluded = excludeIds?.has(q.id);
            return (
              <div
                key={q.id}
                onClick={() => !excluded && onSelect?.(q)}
                className={`flex items-start gap-3 rounded-lg border border-surface-border p-3 transition-colors ${
                  onSelect && !excluded
                    ? "cursor-pointer hover:border-accent/30"
                    : excluded
                      ? "opacity-50"
                      : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium text-text ${compact ? "text-sm" : ""}`}
                  >
                    {q.text}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge {...difficultyColor(q.difficulty)}>
                      {q.difficulty}
                    </Badge>
                    <Badge>{q.category}</Badge>
                    <Badge>
                      {q.answer_type === "mc" ? "MC" : "Free Text"}
                    </Badge>
                    {q.points !== 1 && (
                      <Badge color="#a78bfa" bg="#a78bfa20">
                        {q.points}pt{q.points !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {!compact && (
                      <span className="text-xs text-text-dim">
                        Used {q.used_count}x
                        {q.last_used_at &&
                          ` \u00B7 Last ${new Date(q.last_used_at).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
                {excluded && (
                  <span className="text-sm text-correct">Added</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-text-dim">
            {total} question{total !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-md px-3 py-1 text-sm text-text-mid transition-colors hover:bg-surface-hi disabled:opacity-30"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-sm text-text-mid">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-md px-3 py-1 text-sm text-text-mid transition-colors hover:bg-surface-hi disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
