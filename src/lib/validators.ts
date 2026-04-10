import { z } from "zod";

export const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  answer: z.string().min(1, "Answer is required"),
  answer_type: z.enum(["free-text", "mc"]),
  choices: z.array(z.string()).nullable().optional(),
  image_url: z.string().nullable().optional(),
  category: z.string().default("General"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  points: z.number().int().min(0).default(1),
});

export const questionUpdateSchema = questionSchema.partial();

export const csvQuestionSchema = z.object({
  text: z.string().min(1),
  answer: z.string().min(1),
  answer_type: z.enum(["free-text", "mc"]).default("free-text"),
  choices: z.string().optional(), // Pipe-separated: "A|B|C|D"
  category: z.string().default("General"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  points: z
    .string()
    .default("1")
    .transform((v) => parseInt(v, 10) || 1),
});

export const teamJoinSchema = z.object({
  teamName: z.string().min(1).max(40),
  pin: z.string().length(4).optional(),
  deviceId: z.string().uuid(),
  gameId: z.string().uuid(),
});

export const answerSubmitSchema = z.object({
  answer_text: z.string().min(1),
  round_question_id: z.string().uuid(),
  device_id: z.string().uuid(),
});

export const wagerSubmitSchema = z.object({
  wager_amount: z.number().int().min(1),
  round_id: z.string().uuid(),
  device_id: z.string().uuid(),
});

export const gameStateUpdateSchema = z.object({
  phase: z
    .enum([
      "lobby",
      "roundIntro",
      "wagerWait",
      "question",
      "answerReveal",
      "scoreboard",
      "break",
      "sponsorSplash",
      "gameOver",
    ])
    .optional(),
  current_round_id: z.string().uuid().nullable().optional(),
  current_question_id: z.string().uuid().nullable().optional(),
  prev_phase: z.string().nullable().optional(),
  timer_remaining: z.number().int().nullable().optional(),
  timer_running: z.boolean().optional(),
  scoreboard_override: z.boolean().optional(),
});
