export interface Tenant {
    id: string;
    name: string;
    plan: PlanType;
    status: TenantStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum TenantStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    DELETED = "DELETED"
}
export declare enum PlanType {
    FREE = "FREE",
    BASIC = "BASIC",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE"
}
export interface Subscription {
    id: string;
    tenantId: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
    seats: number;
    cancelAtPeriodEnd: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    TRIAL = "TRIAL",
    PAST_DUE = "PAST_DUE",
    CANCELED = "CANCELED",
    INCOMPLETE = "INCOMPLETE"
}
export interface Plan {
    id: string;
    name: string;
    type: PlanType;
    price: number;
    billingPeriod: BillingPeriod;
    features: PlanFeature[];
    limits: UsageLimits;
}
export declare enum BillingPeriod {
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}
export interface PlanFeature {
    name: string;
    description: string;
    included: boolean;
}
export interface UsageLimits {
    apiCalls: number;
    storage: number;
    users: number;
}
export interface Usage {
    id: string;
    tenantId: string;
    feature: string;
    count: number;
    limit: number;
    period: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Invoice {
    id: string;
    tenantId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    dueDate: Date;
    paidAt?: Date;
    pdfUrl?: string;
    lineItems: LineItem[];
    createdAt: Date;
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    OPEN = "OPEN",
    PAID = "PAID",
    VOID = "VOID",
    UNCOLLECTIBLE = "UNCOLLECTIBLE"
}
export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}
export interface AuthContext {
    userId: string;
    tenantId: string;
    email: string;
    role: UserRole;
}
export declare enum UserRole {
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
    BILLING = "BILLING"
}
export interface BaseEvent {
    eventId: string;
    eventType: string;
    timestamp: Date;
    source: string;
    version: string;
}
export interface TenantCreatedEvent extends BaseEvent {
    eventType: 'tenant.created';
    data: {
        tenantId: string;
        name: string;
        plan: PlanType;
    };
}
export interface TenantUpdatedEvent extends BaseEvent {
    eventType: 'tenant.updated';
    data: {
        tenantId: string;
        changes: Partial<Tenant>;
    };
}
export interface SubscriptionCreatedEvent extends BaseEvent {
    eventType: 'subscription.created';
    data: {
        subscriptionId: string;
        tenantId: string;
        planId: string;
        status: SubscriptionStatus;
    };
}
export interface SubscriptionCanceledEvent extends BaseEvent {
    eventType: 'subscription.canceled';
    data: {
        subscriptionId: string;
        tenantId: string;
        canceledAt: Date;
    };
}
export interface UsageReportedEvent extends BaseEvent {
    eventType: 'usage.reported';
    data: {
        tenantId: string;
        feature: string;
        count: number;
        timestamp: Date;
    };
}
export interface UsageExceededEvent extends BaseEvent {
    eventType: 'usage.exceeded';
    data: {
        tenantId: string;
        feature: string;
        current: number;
        limit: number;
    };
}
export interface InvoiceGeneratedEvent extends BaseEvent {
    eventType: 'invoice.generated';
    data: {
        invoiceId: string;
        tenantId: string;
        amount: number;
        dueDate: Date;
    };
}
export interface PaymentFailedEvent extends BaseEvent {
    eventType: 'payment.failed';
    data: {
        invoiceId: string;
        tenantId: string;
        amount: number;
        reason: string;
    };
}
export type DomainEvent = TenantCreatedEvent | TenantUpdatedEvent | SubscriptionCreatedEvent | SubscriptionCanceledEvent | UsageReportedEvent | UsageExceededEvent | InvoiceGeneratedEvent | PaymentFailedEvent;
export interface PaginationInput {
    limit?: number;
    offset?: number;
    cursor?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
}
//# sourceMappingURL=index.d.ts.map