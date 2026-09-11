import type { Role } from "../types";

interface Props {
  role: Role;
  onChange: (role: Role) => void;
}

export function RoleToggle({ role, onChange }: Props) {
  return (
    <div className="role-bar">
      <span className="role-label">Viewing as</span>
      <div className="role-toggle">
        <button
          type="button"
          className={`role-btn${role === "admin" ? " active" : ""}`}
          onClick={() => onChange("admin")}
        >
          Admin
        </button>
        <button
          type="button"
          className={`role-btn${role === "employee" ? " active" : ""}`}
          onClick={() => onChange("employee")}
        >
          Employee
        </button>
      </div>
    </div>
  );
}
