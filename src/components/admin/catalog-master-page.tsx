"use client";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { accessToken } from "@/lib/supabase-client";
type Kind = "sectors" | "providers" | "types";
type Row = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  active: boolean;
  icon?: string | null;
  sort_order?: number;
  logo_url?: string | null;
  website_url?: string | null;
  api_status?: string;
  category_id?: string;
  categories?: { id: string; name: string } | null;
};
type Sector = { id: string; name: string };
const copy = {
  sectors: {
    title: "Product Sectors",
    description:
      "Manage top-level insurance and investment sectors such as Health, Motor and Travel.",
    singular: "Product sector",
  },
  providers: {
    title: "Provider Companies",
    description:
      "Manage insurance and investment providers, their logos and integration status.",
    singular: "Provider company",
  },
  types: {
    title: "Product Types",
    description:
      "Define sector-specific product types such as Family Floater, Self, Comprehensive and Third Party.",
    singular: "Product type",
  },
};
async function api(url: string, init: RequestInit = {}) {
  const token = await accessToken();
  return fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  });
}
export function CatalogMasterPage({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const requests = [
      api(`/api/admin/masters/${kind}`),
      ...(kind === "types" ? [api("/api/admin/masters/sectors")] : []),
    ];
    const responses = await Promise.all(requests);
    const body = await responses[0].json();
    if (responses[0].ok) setRows(body.data);
    else setError(body.error);
    if (responses[1]?.ok) setSectors((await responses[1].json()).data);
    setLoading(false);
  }, [kind]);
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        [row.name, row.description, row.categories?.name]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rows, query],
  );
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    let logoUrl = String(form.get("existingLogo") || "");
    const logo = form.get("logo");
    if (kind === "providers" && logo instanceof File && logo.size) {
      const upload = new FormData();
      upload.append("logo", logo);
      const uploaded = await api("/api/admin/masters/provider-logo", {
        method: "POST",
        body: upload,
      });
      const body = await uploaded.json();
      if (!uploaded.ok) return setError(body.error);
      logoUrl = body.data.url;
    }
    const payload: Record<string, unknown> = {
      name: form.get("name"),
      description: form.get("description"),
      active: form.get("active") === "on",
    };
    if (kind === "sectors") {
      payload.icon = form.get("icon");
      payload.sortOrder = form.get("sortOrder");
    }
    if (kind === "types") {
      payload.categoryId = form.get("categoryId");
      payload.sortOrder = form.get("sortOrder");
    }
    if (kind === "providers") {
      payload.websiteUrl = form.get("websiteUrl");
      payload.apiStatus = form.get("apiStatus");
      payload.logoUrl = logoUrl;
    }
    const response = await api(
      `/api/admin/masters/${kind}${editing ? `/${editing.id}` : ""}`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const body = await response.json();
    if (!response.ok) return setError(body.error);
    setEditing(undefined);
    await load();
  }
  async function toggle(row: Row) {
    const response = await api(`/api/admin/masters/${kind}/${row.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    if (response.ok) load();
    else setError((await response.json()).error);
  }
  async function remove(row: Row) {
    if (
      !confirm(`Delete ${row.name}? Records already in use cannot be deleted.`)
    )
      return;
    const response = await api(`/api/admin/masters/${kind}/${row.id}`, {
      method: "DELETE",
    });
    if (response.ok) load();
    else setError((await response.json()).error);
  }
  const meta = copy[kind];
  return (
    <div className="catalog-master-page">
      <header className="master-heading">
        <div>
          <p className="admin-eyebrow">Catalog masters</p>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        <button className="primary-button" onClick={() => setEditing(null)}>
          + Add {meta.singular}
        </button>
      </header>
      <section className="master-summary">
        <article>
          <span>All records</span>
          <strong>{rows.length}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{rows.filter((row) => row.active).length}</strong>
        </article>
        <article>
          <span>Inactive</span>
          <strong>{rows.filter((row) => !row.active).length}</strong>
        </article>
      </section>
      <section className="panel master-table-card">
        <div className="master-toolbar">
          <input className="mp-control"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${meta.title.toLowerCase()}…`}
          />
          <span>{filtered.length} records</span>
        </div>
        {error && <p className="form-error master-error">{error}</p>}
        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>{meta.singular}</th>
                {kind === "types" && <th>Sector</th>}
                {kind === "providers" && <th>Integration</th>}
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Loading master records…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>No records found.</td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="master-identity">
                        {kind === "providers" && row.logo_url ? (
                          <Image
                            src={row.logo_url}
                            alt=""
                            width={48}
                            height={48}
                            unoptimized
                          />
                        ) : (
                          <span>
                            {row.icon || row.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <strong>{row.name}</strong>
                          <small>{row.slug}</small>
                        </div>
                      </div>
                    </td>
                    {kind === "types" && <td>{row.categories?.name || "—"}</td>}
                    {kind === "providers" && (
                      <td>
                        <span className="master-api-status">
                          {(row.api_status || "not_integrated").replaceAll(
                            "_",
                            " ",
                          )}
                        </span>
                      </td>
                    )}
                    <td className="master-description">
                      {row.description || "—"}
                    </td>
                    <td>
                      <button
                        className={`master-switch ${row.active ? "active" : ""}`}
                        onClick={() => toggle(row)}
                        aria-label={`${row.active ? "Deactivate" : "Activate"} ${row.name}`}
                      >
                        <i />
                      </button>
                    </td>
                    <td>
                      <div className="master-actions">
                        <button onClick={() => setEditing(row)}>Edit</button>
                        <button className="danger" onClick={() => remove(row)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editing !== undefined && (
        <div className="master-modal" onMouseDown={() => setEditing(undefined)}>
          <form
            onSubmit={save}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="admin-eyebrow">{editing ? "Modify" : "Create"}</p>
                <h2>{meta.singular}</h2>
              </div>
              <button type="button" onClick={() => setEditing(undefined)}>
                ×
              </button>
            </header>
            <label className="mp-label">
              Name *
              <input className="mp-control"
                name="name"
                required
                minLength={2}
                defaultValue={editing?.name || ""}
                placeholder={`Enter ${meta.singular.toLowerCase()} name`}
              />
            </label>
            {kind === "sectors" && (
              <>
                <label className="mp-label">
                  Icon / Emoji
                  <input className="mp-control"
                    name="icon"
                    maxLength={20}
                    defaultValue={editing?.icon || ""}
                    placeholder="e.g. ♡ or 🚗"
                  />
                </label>
                <label className="mp-label">
                  Display order
                  <input className="mp-control"
                    name="sortOrder"
                    type="number"
                    min={0}
                    defaultValue={editing?.sort_order || 0}
                  />
                </label>
              </>
            )}
            {kind === "types" && (
              <>
                <label className="mp-label">
                  Product sector *
                  <select className="mp-control"
                    name="categoryId"
                    required
                    defaultValue={editing?.category_id || ""}
                  >
                    <option value="" disabled>
                      Select sector
                    </option>
                    {sectors.map((sector) => (
                      <option value={sector.id} key={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mp-label">
                  Display order
                  <input className="mp-control"
                    name="sortOrder"
                    type="number"
                    min={0}
                    defaultValue={editing?.sort_order || 0}
                  />
                </label>
              </>
            )}
            {kind === "providers" && (
              <>
                <input
                  type="hidden"
                  name="existingLogo"
                  value={editing?.logo_url || ""}
                />
                <label className="mp-label">
                  Company logo
                  <input className="mp-control"
                    name="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  />
                  <small>PNG, JPG, WEBP or SVG · Maximum 2 MB</small>
                </label>
                <label className="mp-label">
                  Website URL
                  <input className="mp-control"
                    name="websiteUrl"
                    type="url"
                    defaultValue={editing?.website_url || ""}
                    placeholder="https://provider.com"
                  />
                </label>
                <label className="mp-label">
                  API integration
                  <select className="mp-control"
                    name="apiStatus"
                    defaultValue={editing?.api_status || "not_integrated"}
                  >
                    <option value="not_integrated">Not integrated</option>
                    <option value="testing">Testing</option>
                    <option value="integrated">Integrated</option>
                  </select>
                </label>
              </>
            )}
            <label className="wide mp-label">
              Description
              <textarea className="mp-control"
                name="description"
                defaultValue={editing?.description || ""}
                placeholder="Short description"
              />
            </label>
            <label className="master-active mp-label">
              <input className="mp-check"
                name="active"
                type="checkbox"
                defaultChecked={editing?.active ?? true}
              />
              Active and available for use
            </label>
            {error && <p className="form-error wide">{error}</p>}
            <footer>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditing(undefined)}
              >
                Cancel
              </button>
              <button className="primary-button">
                {editing ? "Save changes" : `Create ${meta.singular}`}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
