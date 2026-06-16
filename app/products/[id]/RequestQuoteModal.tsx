"use client";

import React, { useState } from "react";
import { Button } from "@/components/base";
import { Input } from "@/components/base";

interface MessageDistributorModalProps {
  setIsMessageDistributorModalOpen: (isOpen: boolean) => void;
  onOpenPopup?: () => void;
}

export default function MessageDistributorModal({
  setIsMessageDistributorModalOpen,
  onOpenPopup,
}: MessageDistributorModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailAddress: "",
    message: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    // Close modal after submission
    setIsMessageDistributorModalOpen(false);
    // Open popup
    if (onOpenPopup) {
      onOpenPopup();
    }
    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      emailAddress: "",
      message: "",
    });
  };

  return (
    <div className=" space-y-8">
        <p>Fill the form below and submit to request for a quote</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* First Name */}
        <Input
          id="firstName"
          label="First name"
          type="text"
          placeholder="Enter your first name"
          value={formData.firstName}
          onValueChange={(val) => handleInputChange("firstName", val)}
          className="[&>label]:text-white [&>label]:text-sm [&>label]:font-medium [&>label]:mb-2 [&>label]:pl-0 [&_input]:rounded-md [&_input]:border-white [&_input]:bg-transparent [&_input]:text-white [&_input]:placeholder:text-white/70 [&_input]:focus:ring-2 [&_input]:focus:ring-white [&_input]:focus:border-white"
        />

        {/* Last Name */}
        <Input
          id="lastName"
          label="Last name"
          type="text"
          placeholder="Enter your last name"
          value={formData.lastName}
          onValueChange={(val) => handleInputChange("lastName", val)}
          className="[&>label]:text-white [&>label]:text-sm [&>label]:font-medium [&>label]:mb-2 [&>label]:pl-0 [&_input]:rounded-md [&_input]:border-white [&_input]:bg-transparent [&_input]:text-white [&_input]:placeholder:text-white/70 [&_input]:focus:ring-2 [&_input]:focus:ring-white [&_input]:focus:border-white"
        />

        {/* Phone Number */}
        <Input
          id="phoneNumber"
          label="Phone number"
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phoneNumber}
          onValueChange={(val) => handleInputChange("phoneNumber", val)}
          className="[&>label]:text-white [&>label]:text-sm [&>label]:font-medium [&>label]:mb-2 [&>label]:pl-0 [&_input]:rounded-md [&_input]:border-white [&_input]:bg-transparent [&_input]:text-white [&_input]:placeholder:text-white/70 [&_input]:focus:ring-2 [&_input]:focus:ring-white [&_input]:focus:border-white"
        />

        {/* Email Address */}
        <Input
          id="emailAddress"
          label="Email address"
          type="email"
          placeholder="Enter your email address"
          value={formData.emailAddress}
          onValueChange={(val) => handleInputChange("emailAddress", val)}
          className="[&>label]:text-white [&>label]:text-sm [&>label]:font-medium [&>label]:mb-2 [&>label]:pl-0 [&_input]:rounded-md [&_input]:border-white [&_input]:bg-transparent [&_input]:text-white [&_input]:placeholder:text-white/70 [&_input]:focus:ring-2 [&_input]:focus:ring-white [&_input]:focus:border-white"
        />

        {/* Message Textarea */}
        <div className="flex flex-col w-full">
          <label
            htmlFor="message"
            className="block  text-sm mb-2"
          >
            Message
          </label>
          <textarea
            id="message"
            placeholder="Enter message here..."
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            rows={5}
            className="block w-full rounded-md border border-[#DDE0E5] bg-transparent px-4 py-3 placeholder:text-[#6B7280] focus:ring-2 focus:ring-[#DDE0E5] focus:border-[#DDE0E5] resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            title="Send Message"
            variant="primary"
            size="md"
            type="submit"
            className="w-full bg-[#0669D9] hover:bg-[#0556b8] border-[#0669D9] text-white"
          />
        </div>
      </form>
    </div>
  );
}

