"use client";
import React from "react";
import { Facebook, Linkedin, Twitter, ArrowUp, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";
import Button from "./Typography/Button";

const Footer = () => {
  return (
    <footer className="bg-primary-dark text-white py-12 px-6 sm:px-10 lg:px-20 font-Urbanist relative">
      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Logo + About */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/images/Logo.png"
              alt="MedProcure logo"
              width={130}
              height={45}
              priority
            />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed max-w-xs mb-6">
            Your trusted B2B marketplace for industrial equipment and
            consumables across Africa.
          </p>

          {/* Social Icons */}
            <div className="flex gap-4 mt-4">
            <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Facebook page"
                title="Facebook"
                className="w-10 h-10 rounded-full border border-gray-500 flex items-center justify-center hover:bg-secondary hover:text-white transition"
            >
                <Facebook size={16} />
            </a>

            <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our LinkedIn profile"
                title="LinkedIn"
                className="w-10 h-10 rounded-full border border-gray-500 flex items-center justify-center hover:bg-secondary hover:text-white transition"
            >
                <Linkedin size={16} />
            </a>

            <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Twitter page"
                title="Twitter"
                className="w-10 h-10 rounded-full border border-gray-500 flex items-center justify-center hover:bg-secondary hover:text-white transition"
            >
                <Twitter size={16} />
            </a>
            </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="hover:text-secondary transition">Service Engineers</li>
            <li className="hover:text-secondary transition">Distributors</li>
          </ul>
        </div>

        {/* Menu Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Menu Links</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="hover:text-secondary transition">Our Products</li>
            <li className="hover:text-secondary transition">Categories</li>
            <li className="hover:text-secondary transition">FAQs</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>

          <div className="flex items-start gap-2 text-sm text-gray-300 mb-4">
            <MapPin size={14} color="#F9FAFB" className="mt-0.5 shrink-0" />
            <span>24 Bode Thomas Street, Surulere, Lagos, Nigeria.</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
            <Phone size={14} color="#F9FAFB" className="shrink-0" />
            <span>+234 908 700 573 5</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Mail size={14} color="#F9FAFB" className="shrink-0" />
            <span>support.medprocure.info.ng</span>
          </div>
        </div>
      </div>

      {/* Divider and Bottom Bar */}
      <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-sm text-gray3 text-center md:text-left">
          Copyright ©{" "}
          <span className="text-secondary font-medium">MedProcure</span> 2025. All
          Rights Reserved.
        </p>

        {/* Scroll to Top Button */}
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="bg-primary-light! w-11 h-11 rounded-2xl flex items-center justify-center"
        >
          <ArrowUp size={20} color="#053782" />
        </Button>
      </div>
    </footer>
  );
};

export default Footer;