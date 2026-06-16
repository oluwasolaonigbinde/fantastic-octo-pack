"use client";

import Link from "next/link";
import {
  ArrowUp,
  Facebook,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import Image from "next/image";

const quickLinks = [{ label: "Service Engineers", href: "/service-engineers" }];

const menuLinks = [
  { label: "Our Products", href: "/products" },
  { label: "Categories", href: "/products" },
  { label: "FAQs", href: "/products" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-[#06285f] text-white">
      <div className="mx-auto max-w-[1220px] px-4 pb-8 pt-12 sm:px-6 lg:px-8 lg:pt-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr]">
          <div className="max-w-[310px]">
            <Image
              src="/images/logo-light.png"
              alt="MedProcure logo"
              width={112}
              height={36}
              priority
              className="h-auto w-auto"
              style={{ width: "auto", height: "auto" }}
            />

            <p className="mt-4 text-sm leading-7 text-[#c1d0ea]">
              Source medical equipment with more confidence through verified
              suppliers, trusted discovery, and marketplace support built for
              Africa.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Facebook page"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5f7398] text-[#e8eefb] transition hover:border-[#fe6e00] hover:text-[#fe6e00]"
              >
                <Facebook size={15} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our LinkedIn profile"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5f7398] text-[#e8eefb] transition hover:border-[#fe6e00] hover:text-[#fe6e00]"
              >
                <Linkedin size={15} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Twitter page"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5f7398] text-[#e8eefb] transition hover:border-[#fe6e00] hover:text-[#fe6e00]"
              >
                <Twitter size={15} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">Quick Links</h3>
            <div className="mt-4 space-y-3 text-sm text-[#c1d0ea]">
              {quickLinks.map((link) => (
                <Link key={link.label} href={link.href} className="block transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">Menu Links</h3>
            <div className="mt-4 space-y-3 text-sm text-[#c1d0ea]">
              {menuLinks.map((link) => (
                <Link key={link.label} href={link.href} className="block transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">Get in Touch</h3>

            <div className="mt-4 space-y-3.5 text-sm text-[#c1d0ea]">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-white" />
                <span>24 Bode Thomas Street, Surulere, Lagos, Nigeria.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0 text-white" />
                <span>+234 908 700 5735</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0 text-white" />
                <span>support@medprocure.info.ng</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-[#294672] pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#90a7cc]">
            Copyright &copy; <span className="font-semibold text-[#fe6e00]">MedProcure</span> 2025. All Rights Reserved.
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-[#053782] transition hover:bg-[#e6f1ff]"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
}
