function hex2rgb(hex) {
  return [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map(hexString =>
    parseInt(hexString, 16)
  );
}

export function luminance(hex) {
  var parts = hex2rgb(hex).map(channel => {
    channel /= 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return parts[0] * 0.2126 + parts[1] * 0.7152 + parts[2] * 0.0722;
}

export function contrast(hex1, hex2) {
  return (luminance(hex1) + 0.05) / (luminance(hex2) + 0.05);
}
