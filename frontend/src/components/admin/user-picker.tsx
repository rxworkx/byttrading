"use client";

import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AdminUser } from "@/lib/admin-api";

interface UserPickerProps {
  users: AdminUser[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
}

// Type a name or email to filter, then click a match to select. The same
// filtered list works whether typing a full email or just a first name,
// since matching runs against both fields.
export function UserPicker({ users, value, onChange, placeholder }: UserPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedUser = users.find((u) => u.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users.slice(0, 25);
    return users
      .filter((u) => {
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        return name.includes(q) || u.email.toLowerCase().includes(q);
      })
      .slice(0, 25);
  }, [users, query]);

  function handleSelect(user: AdminUser) {
    onChange(user.id);
    setQuery("");
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex h-11 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-4 text-left text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            {selectedUser ? (
              <span className="truncate">
                {selectedUser.firstName} {selectedUser.lastName}{" "}
                <span className="text-muted-foreground">({selectedUser.email})</span>
              </span>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder ?? "Search by name or email"}</span>
            )}
          </button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) p-0">
        <div className="border-b border-hairline p-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a name or email"
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches.length === 1) {
                e.preventDefault();
                handleSelect(matches[0]);
              }
            }}
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {matches.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">No users match.</div>
          ) : (
            matches.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelect(u)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary"
              >
                <UserRound className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {u.firstName} {u.lastName} <span className="text-muted-foreground">({u.email})</span>
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
