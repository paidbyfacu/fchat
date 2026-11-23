import { rich } from "@/lib/i18n/rich"
import { getT, pageTitle } from "@/server/i18n"

export const generateMetadata = pageTitle((t) => t.legal.privacyTitle)

export default async function PrivacyPage() {
  const t = (await getT()).t.legal
  return (
    <main className="mx-auto grid max-w-2xl gap-4 px-4 py-12 text-base leading-relaxed">
      <h1 className="text-xl">{t.privacyTitle}</h1>
      <p>{t.privacy1}</p>
      <p>{t.privacy2}</p>
      <p>{t.privacy3}</p>
      <p>
        {rich(t.privacy4, {
          a: (c) => (
            <a className="text-link underline" href="/data-deletion">
              {c}
            </a>
          ),
        })}
      </p>
    </main>
  )
}
