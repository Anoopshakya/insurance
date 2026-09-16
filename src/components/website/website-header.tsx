"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Megaphone,
  Menu,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

const defaultAnnouncement = {
  message:
    "Become a Partner & Grow Magically. Join thousands of successful partners with MagikPolicy! ",
  linkText: "Know More",
  linkUrl: "/partner/register",
  active: true,
};

function AnnouncementBar() {
  const [data, setData] = useState(defaultAnnouncement),
    [shown, setShown] = useState(true);
  useEffect(() => {
    fetch("/api/public/announcement")
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => {
        if (r?.data) {
          setData(r.data);
          setShown(r.data.active !== false);
        }
      })
      .catch(() => undefined);
  }, []);
  if (!shown) return null;
  return (
    <div className="website-announcement grid min-h-8 grid-cols-[auto_1fr_auto_auto] items-center gap-4 bg-gradient-to-r from-[#4315c5] via-[#a514aa] to-[#f31368] px-[3.2vw] text-white max-md:min-h-20 max-md:grid-cols-[auto_1fr_auto] max-md:gap-2 max-md:px-4 max-[520px]:grid-cols-[auto_1fr]">
      <Megaphone className="h-6 w-6" />
      <span className="min-w-0 text-[15px] font-normal leading-snug max-md:text-[10px]">
        {data.message}
      </span>
      <Link
        className="whitespace-nowrap text-[15px] font-medium text-white max-md:text-[10px] max-[520px]:hidden"
        href={data.linkUrl}
      >
        {data.linkText} &nbsp;→
      </Link>
      <button
        className="grid place-items-center border-0 bg-transparent text-white max-md:hidden"
        onClick={() => setShown(false)}
        aria-label="Dismiss announcement"
      >
        <X />
      </button>
    </div>
  );
}

export function WebsiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnnouncementBar />
      <header className="website-navbar relative z-30 flex h-[80px] items-center border-b border-[var(--appearance-border,#e7e9f3)] bg-[var(--appearance-surface,#fff)] px-[2.1vw] shadow-[0_4px_20px_rgba(28,32,85,.035)] max-lg:h-24 max-md:h-[92px] max-md:px-4">
        <Link href="/" aria-label="MagikPolicy home">
          <Image
            className="h-auto w-[250px] max-2xl:w-[320px] max-xl:w-[260px] max-md:w-[150px]"
            src="/brand/magikpolicy-logo.png"
            alt="MagikPolicy"
            width={420}
            height={140}
            priority
          />
        </Link>
        <div className="ml-auto flex items-center justify-end">
          <nav
            className={`${open ? "grid" : "hidden"} absolute left-0 right-0 top-full bg-[var(--appearance-surface,#fff)] p-5 shadow-xl xl:static xl:flex xl:items-center xl:gap-8 xl:bg-transparent xl:p-0 xl:shadow-none 2xl:gap-[36px]`}
          >
            {[
              ["Health", "health"],
              ["Motor", "motor"],
              ["Life", "life"],
              ["Term", "term"],
            ].map(([label, slug]) => (
              <Link
                className="flex items-center py-3 text-[14px] font-normal text-[var(--appearance-text,#111111)] max-2xl:text-[17px]"
                href={`/products/${slug}`}
                key={slug}
              >
                {label}
              </Link>
            ))}
          </nav>
          <label className="ml-8 hidden h-[60px] w-[300px] items-center rounded-[10px] border border-[var(--appearance-border,#c8bdf8)] bg-[var(--appearance-surface,#fff)] px-[21px] shadow-[0_2px_8px_rgba(83,52,180,.06)] transition-colors focus-within:border-[#6634f1] xl:flex 2xl:ml-[50px] mp-label">
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-normal text-[var(--appearance-muted,#536083)] outline-none placeholder:text-[var(--appearance-muted,#697390)] max-2xl:text-[15px] mp-control"
              placeholder="Search policies, plans, insurers..."
            />
            <Search className="h-[25px] w-[25px] text-[var(--appearance-text,#24305f)]" />
          </label>
          <div className="website-nav-actions absolute right-3 flex items-center gap-1 md:gap-2 xl:static xl:ml-4 xl:gap-4 2xl:ml-6 2xl:gap-[22px]">
            <Link
              className="hidden h-[40px] min-w-[150px] place-items-center rounded-[10px] border-2 border-solid border-[#7447f4] bg-[var(--appearance-surface-raised,#f5f3ff)] px-6 text-sm font-semibold text-[var(--appearance-text,#5527df)] shadow-[0_2px_8px_rgba(83,52,180,.06)] xl:grid 2xl:min-w-[173px] 2xl:text-[16px]"
            href="/customer/login"
            >
              Customer Login
            </Link>
            <Link
              className="hidden h-[40px] min-w-[172px] place-items-center rounded-[10px] bg-gradient-to-r from-[#4319df] via-[#c018b8] to-[#ff641e] px-5 text-sm font-semibold text-white xl:grid 2xl:min-w-[193px] 2xl:px-7 2xl:text-[16px]"
            href="/partner/register"
            >
              Become a Partner
            </Link>
            <button
              className="grid h-9 w-9 place-items-center border-0 bg-[var(--appearance-surface,#fff)] text-[var(--appearance-text,#09164d)] md:h-11 md:w-11 xl:hidden"
              aria-label="Search"
            >
              <Search />
            </button>
            <Link
              className="grid h-9 w-9 place-items-center text-[var(--appearance-text,#09164d)] md:h-11 md:w-11 xl:hidden"
            href="/customer/login"
              aria-label="Login"
            >
              <UserRound />
            </Link>
            <Link
              className="grid btn-primary h-9 w-9 place-items-center rounded-lg bg-[var(--appearance-surface-raised,#f5f3ff)] text-[var(--appearance-text,#6827ef)] md:h-11 md:w-11 xl:hidden"
            href="/partner/register"
              aria-label="Become a Partner"
              title="Become a Partner"
            >
              <UsersRound />
            </Link>
            <button
              className="grid h-9 w-9 place-items-center border-0 bg-[var(--appearance-surface,#fff)] text-[var(--appearance-text,#09164d)] md:h-11 md:w-11 xl:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
