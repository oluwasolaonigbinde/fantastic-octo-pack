import Link from "next/link";
import { Eye, Plus } from "lucide-react";

import {
  getOwnerForId,
  OwnerDetailShell,
} from "../../_components/owner-detail-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

const products = Array.from({ length: 10 }, (_, index) => ({
  id: `product-${index + 1}`,
  name: "The name of the product",
  price: "\u20A6360,028.00",
  quantity: "308",
  status: index === 1 ? "Approved" : "Pending",
  category: "Equipment",
}));

export default async function AgentBusinessOwnerCataloguePage({ params }: PageProps) {
  const { id } = await params;
  const owner = getOwnerForId(id);

  return (
    <OwnerDetailShell ownerId={owner.id} activeTab="Products">
      <section className="rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-5">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              Product catalogue
            </h2>
            <p className="text-sm text-[#6B7280]">
              Manage products for {owner.businessType}
            </p>
          </div>
          <Link
            href={`/dashboard/agent/business-owners/${owner.id}/catalogue/new?step=category`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FE6E00] px-6 py-3 text-sm font-medium text-white"
          >
            Add products <Plus size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-left text-xs font-medium text-[#6B7280]">
                <th className="py-3">Product name</th>
                <th className="py-3">Price</th>
                <th className="py-3">Quantity in stock</th>
                <th className="py-3">Status</th>
                <th className="py-3">Category</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[#F3F4F6]">
                  <td className="py-4">
                    <span className="flex items-center gap-3 text-[#111827]">
                      <span className="size-8 rounded-lg bg-[#D9D9D9]" />
                      {product.name}
                    </span>
                  </td>
                  <td className="py-4 text-[#111827]">{product.price}</td>
                  <td className="py-4 text-[#111827]">{product.quantity}</td>
                  <td
                    className={`py-4 ${
                      product.status === "Approved"
                        ? "text-[#13A83B]"
                        : "text-[#FFC000]"
                    }`}
                  >
                    {product.status}
                  </td>
                  <td className="py-4 text-[#111827]">{product.category}</td>
                  <td className="py-4">
                    <Link
                      href={`/dashboard/agent/business-owners/${owner.id}/catalogue/${product.id}`}
                      className="inline-flex text-[#13A83B]"
                      aria-label={`View ${product.name}`}
                    >
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OwnerDetailShell>
  );
}
