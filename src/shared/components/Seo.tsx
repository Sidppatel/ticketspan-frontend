export function Seo({
  title,
  description,
  image,
}: {
  title: string;
  description?: string;
  image?: string;
}) {
  return (
    <>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      {description ? <meta name="description" content={description} /> : null}
      {description ? <meta property="og:description" content={description} /> : null}
      {image ? <meta property="og:image" content={image} /> : null}
    </>
  );
}
