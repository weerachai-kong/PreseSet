export type ProgramMode = "INTERVAL" | "REPS_SETS";

export type Program = {
  id: string;
  name: string;
  mode: ProgramMode;
  stepCount: number;
  durationMin: number;
  description?: string;
};

export const mockPrograms: Program[] = [
  {
    id: "1",
    name: "HIIT Burn 20",
    mode: "INTERVAL",
    stepCount: 6,
    durationMin: 18,
    description: "High-intensity interval training",
  },
  {
    id: "2",
    name: "Sprint Intervals",
    mode: "INTERVAL",
    stepCount: 6,
    durationMin: 15,
  },
  {
    id: "3",
    name: "Squat Strength",
    mode: "REPS_SETS",
    stepCount: 4,
    durationMin: 22,
  },
  {
    id: "4",
    name: "Core Circuit",
    mode: "INTERVAL",
    stepCount: 5,
    durationMin: 12,
  },
];

export const mockHistory = [
  {
    id: "h1",
    programName: "HIIT Burn 20",
    mode: "INTERVAL" as ProgramMode,
    duration: "18:42",
    dateKey: "Aug 1",
    status: "completed" as const,
  },
  {
    id: "h2",
    programName: "Squat Strength",
    mode: "REPS_SETS" as ProgramMode,
    duration: "22:10",
    dateKey: "Jul 30",
    status: "completed" as const,
  },
  {
    id: "h3",
    programName: "Core Circuit",
    mode: "INTERVAL" as ProgramMode,
    duration: "12:05",
    dateKey: "Jul 28",
    status: "completed" as const,
  },
  {
    id: "h4",
    programName: "Sprint Intervals",
    mode: "INTERVAL" as ProgramMode,
    duration: "15:30",
    dateKey: "Jul 26",
    status: "stopped" as const,
  },
];

export const mockEditSteps = [
  { order: 1, title: "High Knees", detail: "15s work / 5s rest" },
  { order: 2, title: "Burpees", detail: "20s work / 10s rest" },
  { order: 3, title: "Mountain Climbers", detail: "15s work / 5s rest" },
];
