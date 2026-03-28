// In-memory store: taskId → OTP
export const taskOTPStore = new Map<string, string>();

// Generate a random 6-digit OTP string
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP for a given taskId
export function storeOTP(taskId: string, otp: string): void {
  taskOTPStore.set(taskId, otp);
}

// Retrieve OTP for a given taskId
export function getOTP(taskId: string): string | undefined {
  return taskOTPStore.get(taskId);
}

// Verify: returns true if input matches stored OTP for taskId
export function verifyOTP(taskId: string, input: string): boolean {
  const stored = taskOTPStore.get(taskId);
  return stored !== undefined && stored === input.trim();
}
