"use client";

import Link from "next/link";
import { Fragment } from "react";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BannerProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function Banner({ title, breadcrumbs }: BannerProps) {
  return (
    <section
      className="relative flex h-[180px] w-full items-center md:h-[250px]"
      style={{
        backgroundImage: "url('/images/banner.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gray1/80 via-gray1/60 to-transparent" />

      <div className="relative z-10 w-full px-4 sm:px-6 min-[1100px]:px-0">
        <div className="mx-auto max-w-[1420px] px-4">
          <h1 className="mb-3 text-3xl font-extrabold text-white md:text-4xl md:leading-tight">
            {title}
          </h1>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-3 text-sm md:text-base">
              {breadcrumbs.map((item, index) => (
                <Fragment key={index}>
                  {index === 0 ? (
                    <Link
                      href={item.href || "/"}
                      className="hover:text-white transition flex items-center gap-1 text-[#FE6E00]"
                    >
                      <Home size={16} />
                      <span>{item.label}</span>
                    </Link>
                  ) : item.href ? (
                    <Link
                      href={item.href}
                      className="hover:text-white transition text-[#FE6E00]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-300">{item.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </Fragment>
              ))}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
