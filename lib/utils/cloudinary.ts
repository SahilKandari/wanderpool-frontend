type CloudinaryOpts = { width?: number };

export function cloudinaryUrl(
  url: string | null | undefined,
  opts: CloudinaryOpts = {}
): string | null | undefined {
  if (!url) return url;
  if (!url.includes("res.cloudinary.com")) return url;

  const parts = ["q_auto", "f_auto"];
  if (opts.width) parts.push(`w_${opts.width}`, "c_limit");

  return url.replace("/upload/", `/upload/${parts.join(",")}/`);
}
