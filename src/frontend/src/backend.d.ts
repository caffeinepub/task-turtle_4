import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface EscrowPayment {
    status: PaymentStatus;
    taskerUpiId: string;
    userId: string;
    taskId: string;
    razorpayOrderId: string;
    paymentId: string;
    amount: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
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
export interface UserProfile {
    name: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum PaymentStatus {
    PAID = "PAID",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / `maybeCaller` is a default system function that can be used to fetch the caller if available.
     * / In the first update call after each upgrade, the caller is not defined.
     */
    createRazorpayOrder(amount: bigint, taskId: string, userId: string, taskerUpiId: string): Promise<Result>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPaymentByTask(taskId: string): Promise<EscrowPayment | null>;
    getPayments(): Promise<Array<EscrowPayment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markPayoutComplete(paymentId: string): Promise<Result>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    verifyPayment(razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string, taskId: string, amount: bigint, userId: string, taskerUpiId: string): Promise<Result>;
}
