import React from "react";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "lucide-react";

interface Crumbs {
  label: string;
  href: string;
}
interface HeaderProps {
  title: string;
  breadcrumbs?: Crumbs[];
}

/**
 * Render the header section with title and breadcrumbs
 * @param {string} title - The title to display in the header
 * @param {Crumbs[]} breadcrumbs - Optional array of breadcrumb objects
 * @returns
 */
export const Header: React.FC<HeaderProps> = ({ title, breadcrumbs }) => {
  return (
    <section className="relative w-full h-[212px] md:h-[250px] flex items-center bg-[url(/images/banner-small.png)] bg-cover bg-center bg-no-repeat">
      <div className="flex flex-col justify-center items-start gap-3 bg-gray1/50 px-8 md:px-16 h-full w-full">
        <h1 className="text-white text-3xl md:text-5xl font-black">{title}</h1>
        <div className="hidden md:flex items-start capitalize gap-4">
          <Link href="/">
            <HomeIcon className="text-secondary" />
          </Link>
          {breadcrumbs?.map((crumb, index) => (
            <React.Fragment key={`crumb` + index}>
              <span className="text-white">
                <ChevronRightIcon />
              </span>
              {index === breadcrumbs.length - 1 ? (
                <span className="text-white font-semibold">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-secondary hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
