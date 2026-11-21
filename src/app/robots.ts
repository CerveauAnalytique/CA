/** The backend (API and admin panel) is not for search engines; the website is the Flutter app. */
export default function robots() {
  return { rules: [{ userAgent: '*', disallow: '/' }] }
}
