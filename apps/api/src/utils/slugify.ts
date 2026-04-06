/**
 * Converte uma string em slug URL-friendly
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
    .replace(/\s+/g, '-') // espaços → hífens
    .replace(/-+/g, '-') // múltiplos hífens → um
    .replace(/^-+|-+$/g, '') // remove hífens no início/fim
}
