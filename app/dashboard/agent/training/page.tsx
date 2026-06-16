"use client";

import Image from "next/image";
import { ArrowRight, BookOpen, Play, Download, FileText } from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { agentCourses, agentResources } from "../mockdata";

export default function AgentTrainingPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title="Trainings & Courses"
        description="Wednesday 10th September, 2025"
        mobileChrome="profile"
      />
      <main className="min-h-[2195px] space-y-4 bg-[#F5F7FA] px-3 py-4 md:min-h-[calc(100vh-100px)] md:p-4">

        {/* Training courses */}
        <div className="rounded-[12px] border border-[#DDE0E5] bg-white p-4 md:p-5">
          <p className="text-[17px] font-medium text-[#111827] md:text-lg">Training courses</p>
          <p className="mb-5 text-[13px] text-[#374151] md:mb-9 md:text-sm">Structured learning paths to help you succeed.</p>

          <div className="grid gap-4 md:grid-cols-2">
            {agentCourses.map((course) => (
              <div
                key={course.id}
                className="flex min-h-[118px] items-start gap-3.5 rounded-[14px] border border-[#DDE0E5] bg-[#FAFBFC] p-3.5 md:min-h-[188px] md:items-center md:gap-7 md:p-5"
              >
                <span
                  className={`relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] md:size-[88px] ${
                    course.type === "video" ? "bg-[#6B7280]" : ""
                  }`}
                  style={course.type === "video" ? undefined : { backgroundColor: course.accentColor }}
                >
                  {course.type === "video" ? (
                    <>
                      <Image
                        src="/images/profile.webp"
                        alt=""
                        fill
                        className="object-cover grayscale"
                        sizes="44px"
                      />
                      <span className="absolute inset-0 bg-[#111827]/30" />
                      <Play size={28} className="relative z-10 text-white md:size-10" />
                    </>
                  ) : (
                    <BookOpen
                      size={22}
                      style={{
                        color:
                          course.accentColor === "#FEF3C7"
                            ? "#F5B400"
                            : course.accentColor === "#D1FAE5"
                              ? "#22C55E"
                              : "#E23B1D",
                      }}
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1 md:max-w-none">
                  <div className="max-w-[186px] md:max-w-none">
                  <p className="text-[13px] font-semibold leading-6 text-[#111827] md:text-lg">{course.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#6B7280] md:text-sm">{course.description}</p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-2.5 text-[13px] font-medium text-[#0669D9] md:text-base"
                  >
                    Read more
                    <ArrowRight size={18} />
                  </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Downloadable resources */}
        <div className="rounded-[12px] border border-[#DDE0E5] bg-white p-4 md:p-5">
          <p className="text-[17px] font-medium text-[#111827] md:text-lg">Downloadable Resources</p>
          <p className="mb-5 text-[13px] text-[#374151] md:text-sm">Templates, scripts, and guides to help you sell</p>

          <ul className="space-y-4">
            {agentResources.map((res) => (
              <li
                key={res.id}
                className="flex flex-col gap-3.5 rounded-[12px] bg-[#F6FDFF] px-4 py-3.5 md:min-h-[128px] md:flex-row md:items-center md:justify-between md:px-5 md:py-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] md:size-14">
                    <FileText size={18} className="text-[#0669D9]" />
                  </span>
                  <div className="min-w-0 max-w-[190px] md:max-w-none">
                    <p className="text-[12px] font-semibold text-[#111827] md:text-base">{res.title}</p>
                    <p className="text-[11px] leading-[18px] text-[#111827] md:text-sm">{res.description}</p>
                    <p className="mt-1.5 text-[12px] text-[#6B7280]">
                      {res.fileType} {"\u00B7"} {res.fileSize}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10.5 w-full items-center justify-center gap-3 rounded-[10px] bg-[#0669D9] px-4 text-[15px] font-medium text-white md:h-[60px] md:w-[250px] md:text-base"
                >
                  Download
                  <Download size={22} />
                </button>
              </li>
            ))}
          </ul>
        </div>

      </main>
    </ProtectedRoute>
  );
}
