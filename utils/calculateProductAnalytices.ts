import { Product } from "@/types/product";

const calculateAnalytics = (products: Product[] | null) => {
  let approvedPercentage = 0;
  let pendingPercentage = 0;

  const approvedProducts =
    products?.filter((prod) => prod.status === "approved").length || 0;
  const pendingProducts =
    products?.filter((prod) => prod.status === "pending").length || 0;
  if (products) {
    approvedPercentage = (approvedProducts / products.length) * 100 || 0;
    pendingPercentage = (pendingProducts / products.length) * 100 || 0;
  }

  return{
    approvedProducts,
    pendingProducts,
    approvedPercentage,
    pendingPercentage
  }
};

export default calculateAnalytics;
