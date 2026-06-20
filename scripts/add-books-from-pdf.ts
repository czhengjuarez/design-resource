/**
 * Add the 35 books from the BOOKS.pdf that are not yet in the database.
 * Looks up each book on Open Library for cover image + stable URL.
 *
 * Run: node scripts/add-books-from-pdf.ts
 * Then: npx wrangler d1 execute design-resources --remote --file=db/seed/add-books-from-pdf.sql
 */

import { writeFileSync } from "fs";

interface OLSearchResult {
  numFound: number;
  docs: Array<{
    title?: string;
    cover_i?: number;
    author_name?: string[];
    key?: string; // "/works/OL123W"
  }>;
}

const books = [
  { title: "Change",                                    author: "John P. Kotter",         displayAuthor: "John P. Kotter, Vanessa Akhtar, Gaurav Gupta" },
  { title: "Changemakers",                              author: "Maria Giudice",          displayAuthor: "Maria Giudice & Christopher Ireland" },
  { title: "Click Ten Truths for Building Extraordinary Relationships", author: "George Fraser", displayAuthor: "George C. Fraser" },
  { title: "Corporate Rebels Make Work More Fun",       author: "Joost Minnaar",          displayAuthor: "Joost Minnaar & Pim de Morree" },
  { title: "Delivering Happiness",                      author: "Tony Hsieh",             displayAuthor: "Tony Hsieh" },
  { title: "Drive",                                     author: "Daniel H. Pink",         displayAuthor: "Daniel H. Pink" },
  { title: "Engaged Designing for Behavior Change",     author: "Amy Bucher",             displayAuthor: "Amy Bucher" },
  { title: "Farther Faster and Far Less Drama",         author: "Janice Fraser",          displayAuthor: "Janice Fraser & Jason Fraser" },
  { title: "Games People Play",                         author: "Eric Berne",             displayAuthor: "Eric Berne M.D." },
  { title: "How to Win Friends and Influence People",   author: "Dale Carnegie",          displayAuthor: "Dale Carnegie" },
  { title: "Influence Is Your Superpower",              author: "Zoe Chance",             displayAuthor: "Zoe Chance" },
  { title: "Lean Enterprise",                           author: "Jez Humble",             displayAuthor: "Jez Humble, Joanne Molesky & Barry O'Reilly" },
  { title: "Liminal Thinking",                          author: "Dave Gray",              displayAuthor: "Dave Gray" },
  { title: "Multipliers",                               author: "Liz Wiseman",            displayAuthor: "Liz Wiseman" },
  { title: "Navigating the Politics of UX",             author: "John Scott Bowie",       displayAuthor: "John Scott Bowie" },
  { title: "Negotiation Genius",                        author: "Deepak Malhotra",        displayAuthor: "Deepak Malhotra & Max Bazerman" },
  { title: "Never Split the Difference",                author: "Chris Voss",             displayAuthor: "Chris Voss" },
  { title: "One Mission",                               author: "Chris Fussell",          displayAuthor: "Chris Fussell" },
  { title: "Post-Capitalist Society",                   author: "Peter Drucker",          displayAuthor: "Peter F. Drucker" },
  { title: "Present Yourself",                          author: "Danielle Barnes",        displayAuthor: "Danielle Barnes & Christina Wodtke" },
  { title: "Rise of the DEO",                           author: "Maria Giudice",          displayAuthor: "Maria Giudice & Christopher Ireland" },
  { title: "Rituals Roadmap",                           author: "Erica Keswin",           displayAuthor: "Erica Keswin" },
  { title: "Social Chemistry",                          author: "Marissa King",           displayAuthor: "Marissa King" },
  { title: "Speak-Up Culture",                          author: "Stephen Shedletzky",     displayAuthor: "Stephen Shedletzky" },
  { title: "Start-Up Factory",                          author: "Joost Minnaar",          displayAuthor: "Joost Minnaar & Pim de Morree" },
  { title: "Team of Teams",                             author: "Stanley McChrystal",     displayAuthor: "Gen. Stanley McChrystal" },
  { title: "The Big Leap",                              author: "Gay Hendricks",          displayAuthor: "Gay Hendricks" },
  { title: "The Coaching Habit",                        author: "Michael Bungay Stanier", displayAuthor: "Michael Bungay Stanier" },
  { title: "The Creative Act",                          author: "Rick Rubin",             displayAuthor: "Rick Rubin" },
  { title: "The Gervais Principle",                     author: "Venkatesh Rao",          displayAuthor: "Venkatesh Rao" },
  { title: "The Goal",                                  author: "Eliyahu Goldratt",       displayAuthor: "Eliyahu M. Goldratt & Jeff Cox" },
  { title: "The Happiness Track",                       author: "Emma Seppala",           displayAuthor: "Emma Seppälä PhD" },
  { title: "The Toyota Way to Lean Leadership",         author: "Jeffrey Liker",          displayAuthor: "Jeffrey Liker & Gary Convis" },
  { title: "Thinking Fast and Slow",                    author: "Daniel Kahneman",        displayAuthor: "Daniel Kahneman" },
  { title: "Turn the Ship Around",                      author: "David Marquet",          displayAuthor: "L. David Marquet" },
];

function esc(s: string) {
  return s.replace(/'/g, "''");
}

async function search(title: string, author: string): Promise<{ coverUrl: string | null; olUrl: string | null }> {
  const q = encodeURIComponent(`${title} ${author}`);
  const url = `https://openlibrary.org/search.json?q=${q}&fields=key,title,cover_i,author_name&limit=5`;
  const res = await fetch(url, { headers: { "User-Agent": "design-resources-script/1.0" } });
  if (!res.ok) return { coverUrl: null, olUrl: null };
  const data = (await res.json()) as OLSearchResult;
  const hit = data.docs[0];
  if (!hit) return { coverUrl: null, olUrl: null };
  return {
    coverUrl: hit.cover_i ? `https://covers.openlibrary.org/b/id/${hit.cover_i}-M.jpg` : null,
    olUrl: hit.key ? `https://openlibrary.org${hit.key}` : null,
  };
}

async function main() {
  const inserts: string[] = [];
  const noImage: string[] = [];

  for (const book of books) {
    process.stdout.write(`  ${book.title}... `);
    await new Promise((r) => setTimeout(r, 350));
    const { coverUrl, olUrl } = await search(book.title, book.author);
    const url = olUrl ?? "";
    const img = coverUrl ? `'${coverUrl}'` : "NULL";
    const author = `'${esc(book.displayAuthor)}'`;
    inserts.push(
      `INSERT INTO resources (title, author, url, image_url, category_id, type, source, status)\n` +
      `VALUES ('${esc(book.title)}', ${author}, '${esc(url)}', ${img}, 5, 'book', 'manual', 'published');`
    );
    if (!coverUrl) noImage.push(book.title);
    console.log(coverUrl ? "✓ cover" : "✗ no cover");
  }

  const sql = [
    "-- Books from BOOKS.pdf not previously in the database",
    "-- Auto-generated by scripts/add-books-from-pdf.ts",
    "",
    ...inserts,
    "",
    ...(noImage.length ? [`-- No Open Library cover found for:\n${noImage.map(t => `-- ${t}`).join("\n")}`] : []),
  ].join("\n\n");

  writeFileSync("db/seed/add-books-from-pdf.sql", sql);
  console.log(`\nWrote db/seed/add-books-from-pdf.sql  (${inserts.length} books, ${noImage.length} without covers)`);
}

main();
