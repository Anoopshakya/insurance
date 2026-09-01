"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Megaphone,
  Menu,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

const defaultAnnouncement = {
  message:
    "Become a Partner & Earn High Commissions. Join thousands of successful partners with MagikPolicy!",
  linkText: "Know More",
  linkUrl: "/for-partners",
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
    <div className="grid min-h-16 grid-cols-[auto_1fr_auto_auto] items-center gap-4 bg-gradient-to-r from-[#4315c5] via-[#a514aa] to-[#f31368] px-[3.2vw] text-white max-md:min-h-20 max-md:grid-cols-[auto_1fr_auto] max-md:gap-2 max-md:px-4">
      <Megaphone className="h-6 w-6" />
      <span className="min-w-0 text-[15px] font-normal leading-snug max-md:text-[10px]">
        {data.message}
      </span>
      <Link
        className="whitespace-nowrap text-[15px] font-medium text-white max-md:text-[10px]"
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
      <header className="relative z-30 flex h-[130px] items-center border-b border-[#e7e9f3] bg-white px-[2.1vw] shadow-[0_4px_20px_rgba(28,32,85,.035)] max-lg:h-24 max-md:h-[92px] max-md:px-4">
        <Link href="/" aria-label="MagikPolicy home">
          <Image
            className="h-auto w-[340px] max-xl:w-[280px] max-md:w-[150px]"
            src="/brand/magikpolicy-logo.png"
            alt="MagikPolicy"
            width={420}
            height={140}
            priority
          />
        </Link>
        <nav
          className={`${open ? "max-lg:grid" : "max-lg:hidden"} ml-auto flex items-center gap-10 max-xl:gap-6 max-lg:absolute max-lg:left-0 max-lg:right-0 max-lg:top-full max-lg:bg-white max-lg:p-5 max-lg:shadow-xl`}
        >
          {[
            ["Health", "health"],
            ["Motor", "motor"],
            ["Life", "life"],
            ["Term", "term"],
          ].map(([label, slug]) => (
            <Link
              className="flex items-center gap-1.5 py-3 text-[17px] font-normal text-[#121212]"
              href={`/products/${slug}`}
              key={slug}
            >
              {label}
              <ChevronDown className="h-4 w-4" />
            </Link>
          ))}
        </nav>
        <label className="ml-12 flex h-14 w-[430px] items-center rounded-xl border border-[#d9ddeb] px-5 max-2xl:ml-7 max-2xl:w-[340px] max-xl:w-[270px] max-lg:hidden">
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-normal text-[#536083] outline-none"
            placeholder="Search policies, plans, insurers..."
          />
          <Search className="h-6 w-6 text-[#24305f]" />
        </label>
        <div className="ml-5 flex items-center gap-5 max-xl:gap-3 max-lg:ml-auto max-md:gap-1">
          <Link
            className="grid h-14 place-items-center rounded-xl border border-[#6634f1] px-6 text-sm font-semibold text-[#5527df] max-lg:hidden"
            href="/login"
          >
            Login / Register
          </Link>
          <Link
            className="grid h-14 place-items-center rounded-xl bg-gradient-to-r from-[#4319df] via-[#c018b8] to-[#ff641e] px-7 text-sm font-semibold text-white max-xl:px-5 max-lg:hidden"
            href="/partner/register"
          >
            Become a Partner
          </Link>
          <button
            className="hidden h-11 w-11 place-items-center border-0 bg-white text-[#09164d] max-lg:grid max-md:h-9 max-md:w-9"
            aria-label="Search"
          >
            <Search />
          </button>
          <Link
            className="hidden h-11 w-11 place-items-center text-[#09164d] max-lg:grid max-md:h-9 max-md:w-9"
            href="/login"
            aria-label="Login"
          >
            <UserRound />
          </Link>
          <Link
            className="hidden h-11 w-11 place-items-center text-[#6827ef] max-lg:grid max-md:h-9 max-md:w-9"
            href="/for-partners"
            aria-label="Partners"
          >
            <UsersRound />
          </Link>
          <button
            className="hidden h-11 w-11 place-items-center border-0 bg-white text-[#09164d] max-lg:grid max-md:h-9 max-md:w-9"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
