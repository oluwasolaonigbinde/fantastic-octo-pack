"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Header from "../../component/header";
import { Button, Input, PopUp, SingleSelect } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchOemListingRequests } from "@/store/slices/product-slice";

import { buildDistributorSummaries, normalizeOemStatus } from "../oem-ui";

type PlanTier = "free" | "basic" | "premium";
type PlanModalMode = "upgrade" | "downgrade";

const PLAN_DETAILS: Record<
  PlanTier,
  {
    name: string;
    monthly: string;
    billedYearly: string;
    description: string;
  }
> = {
  free: {
    name: "Free Plan",
    monthly: "This is a free plan",
    billedYearly: "No fee is required",
    description: "Visibility level",
  },
  basic: {
    name: "Basic Plan",
    monthly: "N50,000 / month",
    billedYearly: "N150,000 billed yearly",
    description: "RFQ Access",
  },
  premium: {
    name: "Premium Plan",
    monthly: "N75,000 / month",
    billedYearly: "N225,000 billed yearly",
    description: "Messaging Access",
  },
};

export default function OemSubscription() {
  const dispatch = useAppDispatch();
  const { data: authData } = useAppSelector((state) => state.auth);
  const { oemListingRequests } = useAppSelector((state) => state.product);

  const [currentPlan, setCurrentPlan] = useState<PlanTier>("basic");
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("basic");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanTier | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<PlanModalMode>("upgrade");
  const [modalMode, setModalMode] = useState<PlanModalMode | null>(null);
  const [checkoutView, setCheckoutView] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  useEffect(() => {
    if (authData?._id && authData?.tokens?.accessToken) {
      dispatch(
        fetchOemListingRequests({
          assignedOem: authData._id,
          token: authData.tokens.accessToken,
          populate: "createdBy",
        }),
      );
    }
  }, [dispatch, authData?._id, authData?.tokens?.accessToken]);

  const products = useMemo(() => oemListingRequests ?? [], [oemListingRequests]);
  const totalDistributors = useMemo(
    () => buildDistributorSummaries(products).length,
    [products],
  );
  const approvedListings = useMemo(
    () => products.filter((product) => normalizeOemStatus(product.oemApprovalStatus) === "approved").length,
    [products],
  );

  const planDirection: PlanModalMode =
    selectedPlan === "premium" ? "upgrade" : "downgrade";
  const activePlan = PLAN_DETAILS[checkoutPlan ?? selectedPlan];

  return (
    <div>
      <Header title="Subscription plans" description="Manage all subscriptions" />

      <div className="space-y-4 bg-[#F5F7FB] p-4 md:p-6">
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
            <p className="text-sm text-gray3">Total distributor</p>
            <p className="mt-2 text-[32px] font-semibold text-gray1">{totalDistributors}</p>
            <div className="mt-3 flex gap-3 text-xs text-gray3">
              <span className="border-r border-[#D7DEEA] pr-3">Verified: --</span>
              <span>Pending verification: --</span>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
            <p className="text-sm text-gray3">Total approved listing</p>
            <p className="mt-2 text-[32px] font-semibold text-gray1">{approvedListings}</p>
            <div className="mt-3 flex gap-3 text-xs text-gray3">
              <span className="border-r border-[#D7DEEA] pr-3">Equipment: --</span>
              <span>Consumables: --</span>
            </div>
          </div>
        </section>

        {!checkoutView ? (
          <>
            <section className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-gray3">Fee</p>
                  <p className="mt-2 text-xl font-semibold text-gray1">N25,000</p>
                </div>
                <div className="rounded-[20px] border border-[#CFE3FF] bg-[#F6FAFF] px-5 py-4">
                  <p className="text-sm text-gray3">Current Plan</p>
                  <p className="mt-2 text-lg font-medium text-gray1">Regular Quality Plan</p>
                </div>
                <div>
                  <p className="text-sm text-gray3">Renewal date</p>
                  <p className="mt-2 text-xl font-semibold text-gray1">30th May 2025</p>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray1">All available plans - 3</h2>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {(Object.keys(PLAN_DETAILS) as PlanTier[]).map((plan) => {
                  const detail = PLAN_DETAILS[plan];
                  const isSelected = selectedPlan === plan;
                  const isCurrent = currentPlan === plan;

                  return (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`rounded-[20px] border p-5 text-left transition ${
                        isSelected
                          ? "border-primary bg-[#F7FBFF]"
                          : "border-[#E8ECF4] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`size-4 rounded-full border ${
                            isSelected ? "border-primary bg-primary" : "border-gray5"
                          }`} />
                          <span className="text-lg font-medium text-gray1">{detail.name}</span>
                        </div>
                        {isCurrent ? (
                          <span className="rounded-full border border-[#CFE3FF] px-3 py-1 text-xs text-primary">
                            Current Plan
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-6 text-xl font-semibold text-gray1">{detail.monthly}</p>
                      <p className="mt-2 text-sm text-gray3">{detail.billedYearly}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-3 text-sm text-gray2">
                <div>
                  <h3 className="text-lg font-semibold text-gray1">Visibility level</h3>
                  <p className="mt-2">
                    Lorem ipsum dolor sit amet consectetur. Pellentesque tellus in sed neque miat.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray1">RFQ Access</h3>
                  <p className="mt-2">
                    Lorem ipsum dolor sit amet consectetur. Pellentesque tellus in sed neque mi fermentum nisl.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray1">Messaging Access</h3>
                  <p className="mt-2">
                    Lorem ipsum dolor sit amet consectetur. Pellentesque tellus in sed neque mi fermentum nisl.
                  </p>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-lg font-semibold text-gray1">Features</h3>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <label className="inline-flex items-center gap-3 text-sm text-gray2">
                    <input type="checkbox" checked readOnly />
                    Lorem ipsum dolor sit amet consectetur.
                  </label>
                  <label className="inline-flex items-center gap-3 text-sm text-gray2">
                    <input type="checkbox" checked readOnly />
                    Lorem ipsum dolor sit amet consectetur.
                  </label>
                </div>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                <Button
                  title="Downgrade Plan"
                  variant="primaryLight"
                  className="rounded-2xl !border-[#FF9F4A] !text-[#FF9F4A]"
                  onClick={() => {
                    setSelectedPlan("free");
                    setModalMode("downgrade");
                  }}
                />
                <Button
                  title={selectedPlan === "premium" ? "Upgrade Plan" : "Downgrade Plan"}
                  className="rounded-2xl"
                  onClick={() => setModalMode(planDirection)}
                />
              </div>
            </section>
          </>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray1">Select payment method</h2>

              <div className="mt-6 space-y-6">
                <div className="space-y-4 rounded-[20px] border border-[#E8ECF4] p-5">
                  <label className="inline-flex items-center gap-3 text-lg text-gray1">
                    <input type="radio" name="payment-method" defaultChecked />
                    Credit card
                  </label>
                  <Input id="card-number" label="Card number" placeholder="Enter your card number" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input id="card-expiry" label="MM/YY" placeholder="Expiry date (MM/YY)" />
                    <Input id="card-cvv" label="CVV" placeholder="Enter CVV" />
                  </div>
                </div>

                <div className="space-y-4 rounded-[20px] border border-[#E8ECF4] p-5">
                  <label className="inline-flex items-center gap-3 text-lg text-gray1">
                    <input type="radio" name="payment-method" />
                    ESCROW
                  </label>
                  <p className="text-sm text-gray3">My wallet</p>
                  <p className="text-2xl font-semibold text-gray1">N500,000</p>
                </div>

                <div className="space-y-4 rounded-[20px] border border-[#E8ECF4] p-5">
                  <label className="inline-flex items-center gap-3 text-lg text-gray1">
                    <input type="radio" name="payment-method" />
                    Direct pay
                  </label>
                  <div className="grid gap-4 text-sm text-gray2 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray3">Account number</p>
                      <p className="mt-2">2393423874628</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray3">Bank name</p>
                      <p className="mt-2">Opay</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray3">Account name</p>
                      <p className="mt-2">Smart Samuel</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[20px] border border-[#E8ECF4] p-5">
                  <h3 className="text-xl font-semibold text-gray1">Billing address</h3>
                  <label className="inline-flex items-center gap-3 text-sm text-gray2">
                    <input type="checkbox" defaultChecked />
                    Same as shipping address
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input id="billing-phone" label="Phone number" placeholder="Enter your phone number" />
                    <SingleSelect
                      label="Country"
                      options={[{ value: "nigeria", label: "Nigeria" }]}
                      placeholder="Select country"
                    />
                    <SingleSelect
                      label="State"
                      options={[{ value: "abuja", label: "Abuja" }]}
                      placeholder="Select state"
                    />
                    <Input id="billing-city" label="City" placeholder="Enter city" />
                  </div>
                  <Input
                    id="billing-address"
                    label="House home address/street name"
                    placeholder="Enter home address/street name"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray1">Your Order</h2>
              <p className="mt-6 text-sm leading-6 text-gray2">
                You&apos;re about to {checkoutMode === "upgrade" ? "upgrade" : "downgrade"} your monthly subscription to{" "}
                {activePlan.name.toLowerCase()}.
              </p>

              <div className="mt-10 space-y-5 text-sm text-gray2">
                <div className="flex items-center justify-between">
                  <span>Subscription fee</span>
                  <span className="font-medium text-gray1">{activePlan.monthly}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-lg font-semibold text-primary">{activePlan.billedYearly}</span>
                </div>
              </div>

              <div className="mt-10">
                <Button
                  title="Make payment"
                  className="rounded-2xl"
                  onClick={() => {
                    setCurrentPlan(checkoutPlan ?? selectedPlan);
                    setCheckoutView(false);
                    setShowPaymentPopup(true);
                  }}
                />
              </div>
            </div>
          </section>
        )}
      </div>

      <Dialog open={modalMode !== null} onOpenChange={() => setModalMode(null)}>
        <DialogContent className="max-w-[420px] rounded-[28px] border-0 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray1">
              {modalMode === "upgrade"
                ? "Upgrade Subscription Plan"
                : "Downgrade Subscription Plan"}
            </DialogTitle>
            <DialogDescription className="rounded-[20px] border border-[#86BEFF] bg-[#F3FAFF] px-5 py-6 text-center text-sm leading-6 text-gray2">
              {modalMode === "upgrade"
                ? "Are you sure you want to upgrade? This will remove premium privileges and take your account to the premium plan."
                : "Are you sure you want to downgrade? This will remove basic plan privileges and take your account to the free plan."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-sm text-gray2">
            <label className="flex items-start gap-3">
              <input type="checkbox" defaultChecked className="mt-1" />
              <span>
                <span className="block text-base font-medium text-gray1">
                  {modalMode === "upgrade" ? "Upgrade now" : "Downgrade now"}
                </span>
                This will automatically {modalMode === "upgrade" ? "upgrade" : "downgrade"} your
                subscription plan
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <span>
                <span className="block text-base font-medium text-gray1">
                  {modalMode === "upgrade"
                    ? "Upgrade later (Auto renew)"
                    : "Downgrade later"}
                </span>
                This account will be downgraded at the end of your current plan - May 31st 2025
              </span>
            </label>
          </div>

          <div className="rounded-[24px] border border-[#7FE7A2] px-6 py-5 text-center">
            <p className="text-sm text-gray2">Your new fee will be</p>
            <p className="mt-3 text-[32px] font-semibold text-[#2BA84A]">
              {selectedPlan === "free" ? "N0.00 / month" : PLAN_DETAILS[selectedPlan].monthly}
            </p>
            <p className="mt-2 text-sm text-gray3">{PLAN_DETAILS[selectedPlan].billedYearly}</p>
          </div>

          <Button
            title="Continue"
            className="rounded-2xl"
            onClick={() => {
              setCheckoutPlan(selectedPlan);
              setCheckoutMode(modalMode ?? "upgrade");
              setCheckoutView(true);
              setModalMode(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <PopUp
        open={showPaymentPopup}
        type="success"
        title="Congratulations"
        description="Your subscription selection has been updated locally. Billing will be connected once the payment contract is available."
        primaryButtonText="Okay"
        onClose={() => setShowPaymentPopup(false)}
      />
    </div>
  );
}
