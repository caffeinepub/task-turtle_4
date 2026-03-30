import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UserProfileEntry {
    principal: string;
    profile: UserProfile;
}
export interface Task {
    id: string;
    otp: string;
    status: TaskStatus;
    title: string;
    createdAt: bigint;
    description: string;
    category: string;
    acceptor?: Principal;
    amount: bigint;
    location: string;
    poster: Principal;
}
export interface PublicTask {
    id: string;
    status: TaskStatus;
    completedAt?: bigint;
    title: string;
    createdAt: bigint;
    description: string;
    category: string;
    acceptor?: Principal;
    acceptedAt?: bigint;
    amount: bigint;
    location: string;
    poster: Principal;
}
export interface TaskStageResponse {
    stage: string;
    timestamp: bigint;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface TaskParticipantProfiles {
    taskerProfile?: UserProfile;
    posterProfile?: UserProfile;
}
export interface UserProfile {
    studentId?: string;
    name: string;
    aadharNumber?: string;
    upiId: string;
    phone: string;
    location: string;
}
export interface EscrowPayment {
    status: PaymentStatus;
    taskerUpiId: string;
    taskId: string;
    razorpayOrderId: string;
    paymentId: string;
    amount: bigint;
}
export enum PaymentStatus {
    PAID = "PAID",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export enum TaskStatus {
    open = "open",
    completed = "completed",
    accepted = "accepted"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptTask(taskId: string): Promise<PublicTask | null>;
    advanceTaskStage(taskId: string, newStage: string): Promise<Result>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelTask(taskId: string): Promise<Result>;
    completeTask(taskId: string, submittedOtp: string): Promise<PublicTask | null>;
    countTasks(): Promise<bigint>;
    createRazorpayOrder(amount: bigint, taskId: string, _userId: string, _taskerUpiId: string): Promise<Result>;
    createTask(title: string, description: string, category: string, location: string, amount: bigint): Promise<string | null>;
    getAllTasks(): Promise<Array<PublicTask>>;
    getAllUserProfiles(): Promise<Array<UserProfileEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyAcceptedTasks(): Promise<Array<PublicTask>>;
    getMyPostedTasks(): Promise<Array<PublicTask>>;
    getPaymentByTask(taskId: string): Promise<EscrowPayment | null>;
    getPayments(): Promise<Array<EscrowPayment>>;
    getTask(taskId: string): Promise<PublicTask | null>;
    getTaskParticipantProfiles(taskId: string): Promise<TaskParticipantProfiles | null>;
    getTaskStage(taskId: string): Promise<TaskStageResponse | null>;
    getTaskWithOtp(taskId: string): Promise<Task | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markPayoutComplete(paymentId: string): Promise<Result>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    verifyPayment(razorpayPaymentId: string, razorpayOrderId: string, _razorpaySignature: string, taskId: string, amount: bigint, _userId: string, taskerUpiId: string): Promise<Result>;
}
