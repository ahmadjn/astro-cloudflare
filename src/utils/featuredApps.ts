import type { CollectionEntry } from "astro:content";

export function getFeaturedApps(allPosts: CollectionEntry<"posts">[]) {
  const categories = [
    "Art & Design",
    "Entertainment",
    "Music & Audio",
    "Photography",
    "Productivity",
    "Video Players & Editors",
  ];

  const featuredApps: CollectionEntry<"posts">[] = [];

  categories.forEach((category) => {
    // Filter apps by category
    const categoryApps = allPosts.filter(
      (post) => post.data.category === category,
    );

    // Sort by rating (descending) and then by installs (descending)
    const sortedApps = categoryApps.sort((a, b) => {
      const ratingA = parseFloat(a.data.rating);
      const ratingB = parseFloat(b.data.rating);

      // First sort by rating
      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }

      // If ratings are equal, sort by installs
      const installsA = parseFloat(a.data.installs.replace(/[^\d.]/g, ""));
      const installsB = parseFloat(b.data.installs.replace(/[^\d.]/g, ""));

      return installsB - installsA;
    });

    // Take top 2 apps from each category
    const topApps = sortedApps.slice(0, 2);
    featuredApps.push(...topApps);
  });

  return featuredApps;
}

export function parseInstalls(installs: string): number {
  const cleanInstalls = installs.replace(/[^\d.]/g, "");
  const number = parseFloat(cleanInstalls);

  if (installs.includes("M+")) {
    return number * 1000000;
  } else if (installs.includes("K+")) {
    return number * 1000;
  } else if (installs.includes("+")) {
    return number;
  }

  return number;
}

export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}
