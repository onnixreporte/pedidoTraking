type LinkableOrder = { publicId: string; adminToken: string };

function baseUrl() {
  const raw = process.env.APP_BASE_URL ?? '';
  return raw.replace(/\/+$/, '');
}

export function buildLinks(order: LinkableOrder) {
  const base = baseUrl();
  return {
    link_tracking: `${base}/t/${order.publicId}`,
    link_admin: `${base}/c/${order.adminToken}`,
  };
}
