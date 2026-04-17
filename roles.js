export const VAULTFORGE_ROLES = [
  "Buyer",
  "Lender",
  "Title Company",
  "Real Estate Attorney",
  "Contractor",
  "Insurance Provider",
  "Inspector",
  "Investor-Friendly Agent",
  "Vendor"
];

export function buildRoleOptions(selected = "") {
  return VAULTFORGE_ROLES.map((role) => {
    const isSelected = role === selected ? "selected" : "";
    return `<option value="${role}" ${isSelected}>${role}</option>`;
  }).join("");
}
