const publicBase = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
const logoLightPath = `${publicBase}/solar360-logo-light.png?v=20261003_v2`;
const logoDarkPath = `${publicBase}/solar360-logo-dark.png?v=20261003_v2`;
const logoPath = `${publicBase}/solar360-logo-clean.png?v=20261003_v2`;

export const solar360LogoUri = logoPath;
export const solar360LogoFallbackUri = logoPath;
export const solar360LogoLightUri = logoLightPath;
export const solar360LogoDarkUri = logoDarkPath;

export const solarCrmLogoUri = logoPath;
export const solarCrmLogoFallbackUri = logoPath;
export const solarCrmLogoLightUri = logoLightPath;
export const solarCrmLogoDarkUri = logoDarkPath;

export const getSolarLogo = (isDark = false) => (isDark ? logoDarkPath : logoLightPath);
