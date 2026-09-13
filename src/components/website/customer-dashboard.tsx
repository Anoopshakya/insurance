"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase-client";
type Customer = { name: string; customer_code: string };
export function CustomerDashboard() {
  const [customer, setCustomer] = useState<Customer | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    supabaseAuth.auth.getSession().then(async ({ data }) => {
      if (!data.session) return location.replace("/customer/login");
      const response = await fetch("/api/customer/me", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!response.ok) return location.replace("/customer/login");
      setCustomer((await response.json()).data);
    });
  }, []);
  return (
    <main className="customer-dashboard">
      <header>
        <Image
          src="/brand/magikpolicy-logo.png"
          alt="MagikPolicy"
          width={420}
          height={140}
        />
        <button
          onClick={async () => {
            await supabaseAuth.auth.signOut();
            location.replace("/customer/login");
          }}
        >
          Sign out
        </button>
      </header>
      {error ? (
        <section className="customer-dashboard-card">
          <p>{error}</p>
        </section>
      ) : !customer ? (
        <section className="customer-dashboard-card">
          <p>Loading your account…</p>
        </section>
      ) : (
        <>
          <section className="customer-welcome">
            <p className="customer-kicker">Customer dashboard</p>
            <h1>Welcome, {customer.name}</h1>
            <p>Manage your insurance journey in one place.</p>
            <small>Customer ID: {customer.customer_code}</small>
          </section>
          <section className="customer-dashboard-grid">
            <article>
              <span>My Policies</span>
              <strong>View policies</strong>
              <p>Your policies will appear here.</p>
            </article>
            <article>
              <span>Claims</span>
              <strong>Track claims</strong>
              <p>Get claim assistance and track progress.</p>
            </article>
            <article>
              <span>Renewals</span>
              <strong>Upcoming renewals</strong>
              <p>Never miss a renewal.</p>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
