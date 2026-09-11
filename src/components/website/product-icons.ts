import { HeartPulse, CarFront, Bike, ShieldCheck, Plane, Umbrella, UsersRound, WalletCards } from "lucide-react";
export const productIcons = { health: HeartPulse, motor: CarFront, car: CarFront, bike: Bike, term: ShieldCheck, travel: Plane, "personal-accident": Umbrella, family: UsersRound, life: ShieldCheck, investment: WalletCards };
export function productIcon(type:string) { return productIcons[type as keyof typeof productIcons] || ShieldCheck; }
