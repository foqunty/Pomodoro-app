/**
 * Your quotation library. Add, edit or remove entries freely — the UI reads this
 * array and nothing else. An empty array simply hides the quote area.
 *
 * Every entry below was checked against the cited text (public-domain editions
 * on Project Gutenberg / Wikisource) or a well-documented primary source.
 * Translations vary, so the wording is tied to the edition named in `source`.
 */
export interface Quote {
  id: string
  text: string
  author: string
  category?: 'Stoicism' | 'Philosophy' | 'Literature' | 'Athletics' | (string & {})
  /** Human-readable reference, shown under the author's name. */
  source?: string
  /** Where the wording can be verified. */
  sourceUrl?: string
  /**
   * Optional licensed signature image (e.g. '/signatures/jordan.svg' in /public).
   * When absent, the author's name is set as a typographic signature.
   * Only add images you have permission to use.
   */
  signature?: string
}

export const quotes: Quote[] = [
  {
    id: 'marcus-revenge',
    text: 'The best kind of revenge is, not to become like unto them.',
    author: 'Marcus Aurelius',
    category: 'Stoicism',
    source: 'Meditations, VI.5 (Casaubon translation, 1634)',
    sourceUrl: 'https://www.gutenberg.org/ebooks/2680',
  },
  {
    id: 'marcus-true',
    text: 'If it be not fitting, do it not. If it be not true, speak it not.',
    author: 'Marcus Aurelius',
    category: 'Stoicism',
    source: 'Meditations, XII.13 (Casaubon translation, 1634)',
    sourceUrl: 'https://www.gutenberg.org/ebooks/2680',
  },
  {
    id: 'seneca-imagination',
    text: 'We suffer more often in imagination than in reality.',
    author: 'Seneca',
    category: 'Stoicism',
    source: 'Moral Letters to Lucilius, 13 (Gummere translation)',
    sourceUrl: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_13',
  },
  {
    id: 'seneca-harbour',
    text: 'When a man does not know what harbour he is making for, no wind is the right wind.',
    author: 'Seneca',
    category: 'Stoicism',
    source: 'Moral Letters to Lucilius, 71 (Gummere translation)',
    sourceUrl: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_71',
  },
  {
    id: 'epictetus-views',
    text: 'Men are disturbed not by things, but by the views which they take of things.',
    author: 'Epictetus',
    category: 'Stoicism',
    source: 'Enchiridion, 5 (Higginson translation)',
    sourceUrl: 'https://www.gutenberg.org/ebooks/45109',
  },
  {
    id: 'nietzsche-stronger',
    text: 'That which does not kill me, makes me stronger.',
    author: 'Friedrich Nietzsche',
    category: 'Philosophy',
    source: 'Twilight of the Idols, Maxims and Arrows, 8 (Ludovici translation)',
    sourceUrl: 'https://www.gutenberg.org/ebooks/52263',
  },
  {
    id: 'thoreau-deliberately',
    text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life.',
    author: 'Henry David Thoreau',
    category: 'Literature',
    source: 'Walden, “Where I Lived, and What I Lived For”',
    sourceUrl: 'https://www.gutenberg.org/ebooks/205',
  },
  {
    id: 'camus-sisyphus',
    text: "The struggle itself toward the heights is enough to fill a man's heart. One must imagine Sisyphus happy.",
    author: 'Albert Camus',
    category: 'Philosophy',
    source: 'The Myth of Sisyphus (1942), closing lines; Justin O’Brien translation',
  },
  {
    id: 'jordan-failure',
    text: "I've failed over and over and over again in my life. And that is why I succeed.",
    author: 'Michael Jordan',
    category: 'Athletics',
    source: 'Nike “Failure” television commercial, 1997',
  },
]
