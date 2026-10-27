import React from "react";
import "@/styles/account-avatar.css";

export default function AccountAvatar({ user, className = "" }) {
  const paid = ["pro", "business"].includes(user?.plan);
  return (
    <span className={"account-avatar " + (paid ? "is-pro " : "") + className} aria-hidden="true">
      <span className="account-avatar-face">{user?.name?.trim()?.[0] || "و"}</span>
    </span>
  );
}
