type IdentityKind = "partner" | "customer";

function nameInitials(fullName: string) {
  const letters = fullName.toUpperCase().replace(/[^A-Z]/g, "");
  return (letters.slice(0, 2) + "XX").slice(0, 2);
}

export function createIdentityCode(kind: IdentityKind, fullName: string) {
  const type = kind === "partner" ? "P" : "C";
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `MP${type}${nameInitials(fullName)}${random}`;
}
