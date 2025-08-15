import { parseHTML } from "linkedom";
import Head from "next/head";

type DownloadLink = {
  url: string;
  label: string;
};

type ProviderLinks = {
  name: string;
  links360: DownloadLink[];
  links720: DownloadLink[];
};

interface Post {
  title: string;
  videos: string[];
  downloadLinks: ProviderLinks[];
}

// All the head tag should be imported from linkedom

async function getPost(id: string): Promise<Post | null> {
  const res = await fetch(`https://www.watch-movies.com.pk/${id}`, {
    cache: "no-store", // 🔹 Forces SSR fetch
  });
  const html = await res.text();
  const { document } = parseHTML(html);

  const head = document.querySelector("head");

  const titleElement = document.querySelector("h1");
  const videoElements = document.querySelectorAll("iframe");
  const downloadSection = document.querySelectorAll(".singcont");

  if (!titleElement || videoElements.length === 0) {
    return null;
  }

  const title = titleElement.textContent?.trim() || "";
  const videos = Array.from(videoElements).map(
    (video) => video.getAttribute("data-wpfc-original-src") || ""
  );
  const finalVideos = videos.map((video) => {
    if (!video.startsWith("https://") && !video.startsWith("http://")) {
      return `https:${video}`;
    }
    return video;
  });

  const downloadLinks: ProviderLinks[] = []; // Initialize an empty array

  if (downloadSection) {
    // Go through all child elements in order
    const links: DownloadLink[] = [];
    downloadSection[1].querySelectorAll(":scope > *").forEach((el) => {
      const anchorTags = el.querySelectorAll("p > a");
      anchorTags.forEach((anchor) => {
        const link = anchor.getAttribute("href");
        const linkText = anchor.textContent?.trim() || "";
        if (link) {
          links.push({
            url: link,
            label: linkText,
          });
        }
      });
    });

    links.forEach((link) => {
      const match = link.label.match(/\(Link\s+\d+\s+([^\s]+)(?:\s+\d+p)?\)/i);
      if (match) {
        const is360 = link.label.includes("360");
        const is720 = link.label.includes("720");
        const name = match[1]?.replaceAll("-", "");

        const provider = downloadLinks.find((p) => p.name === name);

        if (provider) {
          if (is360) {
            provider.links360.push(link);
          } else if (is720) {
            provider.links720.push(link);
          }
        } else {
          if (is360) {
            downloadLinks.push({
              name,
              links360: [link],
              links720: [],
            });
          } else if (is720) {
            downloadLinks.push({
              name,
              links360: [],
              links720: [link],
            });
          }
        }
      }
    });
  }

  return {
    title,
    videos: finalVideos,
    downloadLinks,
  };
}

// export async function generateStaticParams() {
//   // Generate static paths at build time
//   const res = await fetch("http://localhost:3000/api/posts");
//   const posts = await res.json();

//   return posts.map((post: Post) => ({
//     id: post.id.toString(),
//   }));
// }

export const revalidate = 60; // Revalidate this page every 60 seconds (ISR)

export default async function PostPage({ params }) {
  const { id } = await params;
  const post = await getPost(id || "");

  const { title, videos, downloadLinks } = post || {};

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={title} />
        <meta property="og:image" content={title} />
        <link rel="canonical" href={title} />
      </Head>
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto p-6">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-6 dark:text-white">{title}</h1>

          {/* Video Players */}
          <div className="space-y-8">
            {videos?.map((videoUrl, index) => (
              <div
                key={index}
                className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-md border border-gray-300 dark:border-gray-700"
              >
                <iframe
                  src={videoUrl}
                  title={`${title} - Player ${index + 1}`}
                  className="absolute top-0 left-0 w-full h-full text-white"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>

          {/* Download Section */}
          <div className="mt-12 space-y-10">
            {downloadLinks?.map((provider, i) => (
              <div
                key={i}
                className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm"
              >
                <h2 className="text-lg font-semibold mb-4 dark:text-white">
                  {provider.name} ---------------------------------------
                </h2>

                {/* 360p */}
                <div className="mb-4">
                  <h3 className="font-medium dark:text-gray-300">
                    360p Quality Links {provider.name}
                  </h3>
                  {provider.links360.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-500 hover:underline"
                    >
                      Click To Download (Link {idx + 1} {provider.name} 360p)
                    </a>
                  ))}
                </div>

                {/* 720p */}
                <div>
                  <h3 className="font-medium dark:text-gray-300">
                    720p Quality Links {provider.name}
                  </h3>
                  {provider.links720.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-500 hover:underline"
                    >
                      Click To Download (Link {idx + 1} {provider.name} 720p)
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
