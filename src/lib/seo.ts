export function truncateDescription(text: string, max = 155): string {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, max)) + '…'
}
