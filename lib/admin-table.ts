type QueryUpdate = {
  page?: number;
  pageSize?: number;
  search?: string | null;
  sort?: string | null;
  filter?: string | null;
};

export const updateTableParams = (
  params: URLSearchParams,
  update: QueryUpdate,
) => {
  const next = new URLSearchParams(params.toString());
  if (update.page !== undefined) next.set("page", String(update.page));
  if (update.pageSize !== undefined)
    next.set("pageSize", String(update.pageSize));
  if (update.search !== undefined) {
    if (!update.search) next.delete("q");
    else next.set("q", update.search);
  }
  if (update.sort !== undefined) {
    if (!update.sort) next.delete("sort");
    else next.set("sort", update.sort);
  }
  if (update.filter !== undefined) {
    if (!update.filter) next.delete("filter");
    else next.set("filter", update.filter);
  }
  return next;
};

export const getPage = (params: URLSearchParams) =>
  Number(params.get("page") ?? "1");

export const getPageSize = (params: URLSearchParams) =>
  Number(params.get("pageSize") ?? "20");
