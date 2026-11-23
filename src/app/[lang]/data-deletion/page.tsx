import { getT, pageTitle } from "@/server/i18n"

export const generateMetadata = pageTitle((t) => t.legal.deletionTab)

export default async function DataDeletionPage() {
  const t = (await getT()).t.legal
  return (
    <main className="mx-auto grid max-w-2xl gap-4 px-4 py-12 text-base leading-relaxed">
      <h1 className="text-xl">{t.deletionTitle}</h1>
      <ol className="grid list-decimal gap-2 pl-5">
        <li>{t.deletion1}</li>
        <li>{t.deletion2}</li>
        <li>{t.deletion3}</li>
      </ol>
      <p>{t.deletion4}</p>
    </main>
  )
}
