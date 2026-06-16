"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base";
import {
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { SingleSelect } from "@/components/base";
import { Input } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recentProducts } from "../../mockdata";
import { fetchCategories } from "@/store/slices/category-slice";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";

// Mock interface
interface Products {
  name: string;
  price: string;
  quantityInStock: number;
  status: string;
  categrory: string;
}

export default function AllListedProduct() {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.category);

  useEffect(() => {
    dispatch(fetchCategories({}));
  }, [dispatch]);
  
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [productName, setProductName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [category, setCategory] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    productName: "",
    statusFilter: "",
    category: "",
  });

  const itemsPerPage = 10;

  // Filter products based on applied filters
  // const filteredProducts: Products[] = recentProducts.filter((product: Products) => {
  //   if (
  //     appliedFilters.productName &&
  //     !product.name
  //       .toLowerCase()
  //       .includes(appliedFilters.productName.toLowerCase())
  //   ) {
  //     return false;
  //   }
  //   if (
  //     appliedFilters.verificationStatus &&
  //     product.status.toLowerCase() !==
  //       appliedFilters.verificationStatus.toLowerCase()
  //   ) {
  //     return false;
  //   }
  //   if (
  //     appliedFilters.category &&
  //     product.categrory.toLowerCase() !== appliedFilters.category.toLowerCase()
  //   ) {
  //     return false;
  //   }
  //   return true;
  // });

  // Calculate total pages based on filtered products
  const totalPages = Math.max(
    1
    // Math.ceil(filteredProducts.length / itemsPerPage)
  );

  // Clamp current page to valid range
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Get products for current page
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // const recentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilter = () => {
    setAppliedFilters({
      productName,
      statusFilter,
      category,
    });
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClear = () => {
    setProductName("");
    setStatusFilter("");
    setCategory("");
    setAppliedFilters({
      productName: "",
      statusFilter: "",
      category: "",
    });
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="card mt-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-medium3 text-gray1 mb-2">
          All Products
        </h2>
        <p className="text-sm text-gray2">
          Draft, pending, approved, and rejected products
        </p>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
        <div className="flex items-center justify-between gap-6 flex-wra/p w-full">
          {/* Product name */}
          <Input
            label="Product name"
            placeholder="Enter product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />

          {/* Status */}
          <SingleSelect
            value={statusFilter}
            label="Status"
            onValueChange={(val) => setStatusFilter(val)}
            options={[
              { value: "draft", label: "Draft" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-6 w-full">
          <SingleSelect
            value={category}
            label="Category"
            onValueChange={(val) => setCategory(val)}
            options={categories.map((item) => ({
              value: item._id,
              label: item.name,
            }))}
            className="w-full"
          />

          <Button
            title="Filter"
            variant="primary"
            size="md"
            iconLeft={<SlidersHorizontal className="size-4" />}
            className="whitespace-nowrap self-end"
            onClick={handleFilter}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="h-[400px] overflow-y-auto">
        <Table>
          <TableHeader className="text-gray3">
            <TableRow className="text-gray3">
              {[
                "Product name",
                "Price",
                "Quantity in stock",
                "Status",
                "Category",
                "Action",
              ].map((item) => (
                <TableHead
                  key={item.split(" ")[0]}
                  className="py-3 px-4 text-sm font-medium text-gray1"
                >
                  {item}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentProducts.map((product, idx) => {
              const statusStyle = {
                draft: "text-gray3",
                pending: "text-warning",
                approved: "text-success",
                rejected: "text-danger",
              }[product.status];
              return (
                <TableRow key={`product` + idx}>
                  <TableCell className="flex items-center gap-2">
                    <div className="size-[32px] rounded bg-gray5"></div>
                    {product.name}
                  </TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>{product.quantityInStock}</TableCell>
                  <TableCell className={`${statusStyle} capitalize`}>
                    {product.status}
                  </TableCell>
                  <TableCell>{product.categrory}</TableCell>
                  <TableCell className="inline-flex items-center gap-3">
                    <button className="w-full text-success cursor-pointer">
                      <Eye />
                    </button>
                    <button className="w-full text-primary cursor-pointer">
                      <Pencil />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray1">Page</span>
          <input
            type="number"
            value={validCurrentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
              }
            }}
            className="w-12 rounded border border-gray5 px-2 py-1 text-sm text-center text-gray1 focus:outline-none focus:border-gray2"
            min={1}
            max={totalPages}
          />
          <span className="text-sm text-gray2">of {totalPages}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrevPage}
            disabled={validCurrentPage === 1}
            className={`p-2 rounded border ${
              validCurrentPage === 1
                ? "border-gray5 text-gray4 cursor-not-allowed"
                : "border-gray5 text-gray1 hover:bg-gray7"
            }`}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={validCurrentPage === totalPages}
            className={`p-2 rounded border ${
              validCurrentPage === totalPages
                ? "border-gray5 text-gray4 cursor-not-allowed"
                : "border-primary bg-primary text-white hover:bg-primary-dark"
            }`}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

