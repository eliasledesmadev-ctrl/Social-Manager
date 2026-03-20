"use client";

import { useAppLanguage } from "@/components/providers/language-provider";
import { Select } from "@/components/ui/select";
import type { InstagramAccountData, InstagramAccountScope } from "@/lib/instagram";

type AccountScopeSelectorProps = {
  accounts: InstagramAccountData[];
  value: InstagramAccountScope;
  onChange: (value: InstagramAccountScope) => void;
  id?: string;
};

const copy = {
  en: {
    allAccounts: "All accounts (combined)",
    disconnected: "not connected",
  },
  es: {
    allAccounts: "Todas las cuentas (combinadas)",
    disconnected: "sin conectar",
  },
} as const;

export function AccountScopeSelector({ accounts, value, onChange, id }: AccountScopeSelectorProps) {
  const { language } = useAppLanguage();
  const text = copy[language];

  return (
    <Select id={id} value={value} onChange={(event) => onChange(event.target.value as InstagramAccountScope)}>
      <option value="all">{text.allAccounts}</option>
      {accounts.map((account) => (
        <option key={account.key} value={account.key}>
          {account.label}
          {account.connected ? "" : ` (${text.disconnected})`}
        </option>
      ))}
    </Select>
  );
}
