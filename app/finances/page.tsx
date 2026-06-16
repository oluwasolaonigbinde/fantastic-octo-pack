import React from "react";
import { PublicLayout } from "@/components/layout";
import Banner from "@/components/features/public/Banner";

const page = () => {
  return (
    <PublicLayout banner={<Banner title="Finances" />} />
  );
};

export default page;
