import Link from "next/link"
import { ChevronRightIcon, FileTextIcon, LanguagesIcon, RefreshCwIcon, Share2Icon, ShieldCheckIcon, TagIcon } from "lucide-react"
import { Page, PageHeader } from "@/components/mc/page-header"
import { getT, pageTitle } from "@/server/i18n"
import { LanguageSelect } from "./language-select"

export const generateMetadata = pageTitle((t) => t.settings.title)

export default async function SettingsPage() {
  const { t } = await getT()
  const s = t.settings
  const items = [
    { href: "/conectar", icon: Share2Icon, title: s.itemAccounts, text: s.itemAccountsText, ready: true },
    { href: "/settings/security", icon: ShieldCheckIcon, title: s.itemSecurity, text: s.itemSecurityText, ready: true },
    { href: "/settings/actualizaciones", icon: RefreshCwIcon, title: s.itemUpdates, text: s.itemUpdatesText, ready: true },
    { href: "/terminos", icon: FileTextIcon, title: s.itemTerms, text: s.itemTermsText, ready: true },
    { href: "#", icon: TagIcon, title: s.itemTags, text: t.common.comingSoon, ready: false },
  ]
  return (
    <Page>
      <PageHeader title={s.title} />
      <ul className="grid gap-2 md:max-w-xl">
        {items.map((i) => (
          <li key={i.href + i.title}>
            {i.ready ? (
              <Link href={i.href} className="flex items-center gap-3 rounded-md bg-card p-4 shadow-card hover:bg-muted">
                <i.icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="grid flex-1">
                  <span className="font-medium">{i.title}</span>
                  <span className="text-xs text-muted-foreground">{i.text}</span>
                </span>
                <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-md bg-card p-4 opacity-60 shadow-card" aria-disabled="true">
                <i.icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="grid flex-1">
                  <span className="font-medium">{i.title}</span>
                  <span className="text-xs text-muted-foreground">{i.text}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <section aria-labelledby="idioma" className="flex flex-wrap items-center gap-3 rounded-md bg-card p-4 shadow-card md:max-w-xl">
        <LanguagesIcon className="size-5 text-muted-foreground" aria-hidden />
        <span className="grid flex-1">
          <h2 id="idioma" className="font-medium">
            {s.language}
          </h2>
          <span className="text-xs text-muted-foreground">{s.languageText}</span>
        </span>
        <LanguageSelect />
      </section>
    </Page>
  )
}
