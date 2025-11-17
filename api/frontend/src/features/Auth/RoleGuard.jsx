import { Navigate, useLocation } from "react-router-dom";

// Simple role-based route guard.
// Usage:
//   <RoleGuard allow={["Proprietário", "Gerente"]}>
//      <YourPage />
//   </RoleGuard>
export default function RoleGuard({ allow = [], redirectTo = "/receitas", children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Block if not authenticated at all
  if (!token || token === "undefined" || token === "null" || token.trim() === "") {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  // If no allowed list provided, just require auth
  if (!Array.isArray(allow) || allow.length === 0) {
    return children;
  }

  // Role check (fallback to deny if no role available on client)
  if (!role || !allow.includes(role)) {
    return <Navigate to={redirectTo} replace state={{ from: location, reason: "forbidden" }} />;
  }

  return children;
}
