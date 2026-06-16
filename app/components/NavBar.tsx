"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/base";
import { ArrowRight, Menu, X } from "lucide-react";
import { RightSlider } from "./RightSlider";

const navlinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/service-engineers", label: "Service Engineers" },
  { href: "/finances", label: "Finances" },
  { href: "/logistics", label: "Logistics" },
];

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname(); // ✅ Get pathname first

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [menuOpen]);

  return (
    <nav className="bg-card border-b border-gray5 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-2 h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/images/Logo.png"
              alt="MedProcure Logo"
              width={120}
              height={40}
              priority
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden min-[970px]:flex gap-2 md:gap-6 items-center text-gray-800">
            {navlinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`md:text-sm xl:text-md transition ${
                  isActive(href)
                    ? "text-[#0669D9] font-medium"
                    : "hover:text-[#FE6E00]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Join Now (Desktop) */}
          <Button
            onClick={() => router.push("/login")}
            title="Join Now"
            variant="secondary"
            size="sm"
            iconRight={<ArrowRight />}
            className="hidden min-[970px]:flex px-8 w-fit!"
          />

          {/* Mobile Menu Button */}
          <div className="min-[970px]:hidden flex items-center shrink-0">
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              title=""
              variant="secondaryLight"
              size="sm"
              iconLeft={
                menuOpen ? (
                  <X className="text-gray3" />
                ) : (
                  <Menu className="text-gray3" />
                )
              }
              className="w-auto p-2 border-0 bg-transparent hover:bg-gray7"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            />
          </div>
        </div>
      </div>

      <RightSlider
        title={
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/images/Logo.png"
              alt="MedProcure Logo"
              width={90}
              height={30}
              priority
            />
          </Link>
        }
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <div className="flex flex-col text-center gap-4">
          {navlinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`md:text-sm xl:text-md transition-colors duration-300 ${
                isActive(href)
                  ? "text-[#0669D9] font-medium"
                  : "hover:text-[#FE6E00]"
              }`}
            >
              {label}
            </Link>
          ))}
          <Button
            onClick={() => router.push("/login")}
            title="Join Now"
            variant="secondary"
            size="sm"
            iconRight={<ArrowRight />}
            className="mx-auto max-w-[250px]"
          />
        </div>
      </RightSlider>

      {/* Mobile Dropdown */}
      {/* <Dialog as="div" open={menuOpen} onClose={setMenuOpen}>
        <div className="fixed inset-0 z-50 bg-gray1/80" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full md:w-[500px]">
          <div className="bg-card overflow-y-auto space-y-4 px-6 lg:px-12 py-2 h-screen">
            <div className="flex justify-between items-center py-4 border-b border-gray5">
              <Link href="/" className="shrink-0 flex items-center">
                <Image
                  src="/images/Logo.png"
                  alt="MedProcure Logo"
                  width={120}
                  height={40}
                  priority
                />
              </Link>
              <Button
                onClick={() => setMenuOpen(false)}
                title=""
                variant="secondaryLight"
                size="sm"
                iconLeft={<X className="text-gray3" />}
                className="w-auto p-2 border-0 bg-transparent hover:bg-gray7 shrink-0"
                aria-label="Close menu"
              />
            </div>

            <div className="flex flex-col text-center gap-4">
              {navlinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`md:text-sm xl:text-md transition-colors duration-300 ${
                    isActive(href)
                      ? "text-[#0669D9] font-medium"
                      : "hover:text-[#FE6E00]"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Button
                onClick={() => router.push("/login")}
                title="Join Now"
                variant="secondary"
                size="sm"
                iconRight={<ArrowRight />}
                className="mx-auto max-w-[250px]"
              />
            </div>
          </div>
        </DialogPanel>
      </Dialog> */}
    </nav>
  );
}

