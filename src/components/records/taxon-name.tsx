import { renderInline } from '@/lib/personal-record'

interface TaxonNameProps {
  /** Name with botanical parts wrapped in <i>…</i>; authorities and cultivars stay upright. */
  html: string
  className?: string
}

export function TaxonName({ html, className }: TaxonNameProps) {
  return <span className={className}>{renderInline(html)}</span>
}
