import type { Role } from "../types";

interface Props {
  role: Role;
  onChange: (role: Role) => void;
}

export function RoleToggle({ role, onChange }: Props) {
  return (
    <div className="role-bar">
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
          Staff
        </button>
      </div>
      <span className="role-desc">
        {role === "admin" ? "Admin view · Manage apps and access" : "Staff view · Quick access to your tools"}
      </span>
    </div>
  );
}
