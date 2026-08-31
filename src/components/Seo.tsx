import { Helmet } from "react-helmet-async";

type JsonLd = Record<string, any> | Record<string, any>[];

interface SeoProps {
  title: string;
  description?: string;
  path?: string; // canonical/og:url path, e.g. "/product/foo"
  image?: string; // absolute or relative
  type?: "website" | "article" | "product";
  jsonLd?: JsonLd;
  noindex?: boolean;
}

const toAbsolute = (url?: string) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

const Seo = ({
  title,
  description,
  path,
  image,
  type = "website",
  jsonLd,
  noindex,
}: SeoProps) => {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}${path ?? window.location.pathname}`
      : path ?? "/";
  const absImage = toAbsolute(image);
  const trimmedTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const trimmedDesc = description
    ? description.length > 160
      ? description.slice(0, 157) + "…"
      : description
    : undefined;

  const ldArray = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{trimmedTitle}</title>
      {trimmedDesc && <meta name="description" content={trimmedDesc} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,follow" />}

      <meta property="og:title" content={trimmedTitle} />
      {trimmedDesc && <meta property="og:description" content={trimmedDesc} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {absImage && <meta property="og:image" content={absImage} />}

      <meta name="twitter:card" content={absImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={trimmedTitle} />
      {trimmedDesc && <meta name="twitter:description" content={trimmedDesc} />}
      {absImage && <meta name="twitter:image" content={absImage} />}

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
