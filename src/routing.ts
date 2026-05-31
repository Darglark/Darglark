export function shouldRenderDarglarkingHub(url: URL) {
  return (
    url.pathname === "/darglarking-yellow" ||
    url.searchParams.get("view") === "darglarking-yellow" ||
    url.hash === "#darglarking-yellow"
  );
}
