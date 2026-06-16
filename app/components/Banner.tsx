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
      className="relative w-full h-30 md:h-46 flex items-center"
      style={{
        backgroundImage: "url('/images/banner.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray1/80 via-gray1/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 px-8 md:px-16 w-full">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-3xl md:text-5xl font-extrabold mb-2">
            {title}
          </h1>
          
          {/* Breadcrumb */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm">
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

