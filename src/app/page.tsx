import Image from "next/image";
import { parseHTML } from "linkedom";

function MovieGrid({
  data,
}: {
  data: { title: string; link: string; image: string }[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((item, index) => (
        <a
          key={index}
          href={item.link}
          rel="noopener noreferrer"
          className="block overflow-hidden bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800"
        >
          <div className="relative w-full h-64">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw,
                     (max-width: 1200px) 50vw,
                     25vw"
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
              {item.title}
            </h3>
          </div>
        </a>
      ))}
    </div>
  );
}

async function getCards() {
  const res = await fetch("https://www.watch-movies.com.pk", {
    next: {
      revalidate: 60,
    },
  });
  const html = await res.text();

  const { document } = parseHTML(html);
  const cards = document.querySelectorAll(".boxtitle");

  const data: {
    title: string;
    link: string;
    image: string;
  }[] = [];

  cards.forEach((card) => {
    const titleElement = card.querySelector("h2 a");
    const imageElement = card.querySelector(".wp-post-image");

    // Remove domain keep only path
    const link = titleElement
      ?.getAttribute("href")
      ?.replace("https://www.watch-movies.com.pk", "");

    data.push({
      title: titleElement?.textContent?.trim() || "",
      link: `/post${link}` || "",
      image:
        imageElement?.getAttribute("data-wpfc-original-src") ||
        imageElement?.getAttribute("src") ||
        "",
    });
  });

  return data;
}

export default async function Home() {
  const lastUpdated = new Date().toLocaleTimeString();
  const data = await getCards();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Blog Posts (SSR)</h1>
          <p className="text-gray-500 mb-6">
            This page is rendered on the server for every request.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Last updated: {lastUpdated}
          </p>
          <MovieGrid data={data} />
        </div>
      </main>
    </div>
  );
}
