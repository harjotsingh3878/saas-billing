"use strict";
// Core Domain Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.InvoiceStatus = exports.BillingPeriod = exports.SubscriptionStatus = exports.PlanType = exports.TenantStatus = void 0;
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "ACTIVE";
    TenantStatus["SUSPENDED"] = "SUSPENDED";
    TenantStatus["DELETED"] = "DELETED";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
var PlanType;
(function (PlanType) {
    PlanType["FREE"] = "FREE";
    PlanType["BASIC"] = "BASIC";
    PlanType["PRO"] = "PRO";
    PlanType["ENTERPRISE"] = "ENTERPRISE";
})(PlanType || (exports.PlanType = PlanType = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["TRIAL"] = "TRIAL";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELED"] = "CANCELED";
    SubscriptionStatus["INCOMPLETE"] = "INCOMPLETE";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var BillingPeriod;
(function (BillingPeriod) {
    BillingPeriod["MONTHLY"] = "MONTHLY";
    BillingPeriod["YEARLY"] = "YEARLY";
})(BillingPeriod || (exports.BillingPeriod = BillingPeriod = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["OPEN"] = "OPEN";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["VOID"] = "VOID";
    InvoiceStatus["UNCOLLECTIBLE"] = "UNCOLLECTIBLE";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MEMBER"] = "MEMBER";
    UserRole["BILLING"] = "BILLING";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=index.js.map