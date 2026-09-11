"use client";
import { usePathname } from "next/navigation";
import { PartnerSkeleton, partnerSkeletonView } from "@/components/partner/partner-skeleton";
export default function Loading() { return <PartnerSkeleton fullPage view={partnerSkeletonView(usePathname())} />; }
