import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGetPaginated } from '@/lib/api';
import type { Customer, Product, Invoice } from '@/lib/types';
import type { ComboBoxOption } from '@/components/ui/combobox';

export function useCustomerSearch(search: string = '') {
  const [page, setPage] = useState(1);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['customers', 'search', search, page],
    queryFn: () =>
      apiGetPaginated<Customer>('/customers', {
        search,
        page,
        limit: 20,
      }),
  });

  useEffect(() => {
    if (data?.data) {
      setAllCustomers((prev) => {
        // Reset on search change or page 1
        if (page === 1) return data.data;
        // Append new data
        const existing = new Set(prev.map((c) => c.id));
        const newItems = data.data.filter((c) => !existing.has(c.id));
        return [...prev, ...newItems];
      });
    }
  }, [data, page]);

  useEffect(() => {
    // Reset page when search changes - data effect will handle the array update
    setPage(1);
  }, [search]);

  const loadMore = () => {
    const hasMore = data?.pagination ? data.pagination.page < data.pagination.totalPages : false;
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const options: ComboBoxOption[] = allCustomers.map((customer) => ({
    value: customer.id,
    label: customer.name,
    extra: customer.gstin || customer.email,
  }));

  const hasMore = data?.pagination ? data.pagination.page < data.pagination.totalPages : false;

  return {
    options,
    loading: isLoading || isFetching,
    hasMore,
    loadMore,
  };
}

export function useProductSearch(search: string = '') {
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', 'search', search, page],
    queryFn: () =>
      apiGetPaginated<Product>('/products', {
        search,
        page,
        limit: 20,
      }),
  });

  useEffect(() => {
    if (data?.data) {
      setAllProducts((prev) => {
        if (page === 1) return data.data;
        const existing = new Set(prev.map((p) => p.id));
        const newItems = data.data.filter((p) => !existing.has(p.id));
        return [...prev, ...newItems];
      });
    }
  }, [data, page]);

  useEffect(() => {
    // Reset page when search changes - data effect will handle the array update
    setPage(1);
  }, [search]);

  const loadMore = () => {
    const hasMore = data?.pagination ? data.pagination.page < data.pagination.totalPages : false;
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const options: ComboBoxOption[] = allProducts.map((product) => ({
    value: product.id,
    label: product.name,
    extra: `₹${product.sellingPrice} • ${product.hsnCode || 'No HSN'}`,
  }));

  const hasMore = data?.pagination ? data.pagination.page < data.pagination.totalPages : false;

  return {
    options,
    loading: isLoading || isFetching,
    hasMore,
    loadMore,
    products: allProducts,
  };
}

export function useInvoiceSearch(search: string = '') {
  const [page, setPage] = useState(1);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['invoices', 'search', search, page],
    queryFn: () =>
      apiGetPaginated<Invoice>('/invoices', {
        search,
        page,
        limit: 20,
      }),
  });

  useEffect(() => {
    if (data?.data) {
      setAllInvoices((prev) => {
        if (page === 1) return data.data;
        const existing = new Set(prev.map((i) => i.id));
        const newItems = data.data.filter((i) => !existing.has(i.id));
        return [...prev, ...newItems];
      });
    }
  }, [data, page]);

  useEffect(() => {
    // Reset page when search changes - data effect will handle the array update
    setPage(1);
  }, [search]);

  const loadMore = () => {
    const hasMore = data?.pagination ? data.pagination.page < data.pagination.totalPages : false;
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const options: ComboBoxOption[] = allInvoices.map((invoice) => ({
    value: invoice.id,
    label: invoice.invoiceNumber,
    extra: `${invoice.customer?.name || 'Unknown'} • ₹${invoice.balanceAmount} due`,
  }));

  const hasMore = data?.pagination ? data.pagination.page < data.pagination.totalPages : false;

  return {
    options,
    loading: isLoading || isFetching,
    hasMore,
    loadMore,
    invoices: allInvoices,
  };
}
