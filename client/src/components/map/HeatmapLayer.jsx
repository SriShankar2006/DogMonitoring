import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Soft radial "blob" used as the stamp for every point - stacking many of
// these (each partially transparent) is what produces the hot/cold density
// look, the same technique classic heatmap libraries use.
function createBlobCanvas(radius, blur) {
  const r = radius + blur;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = r * 2;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

// Blue (cold / few dogs) -> green -> yellow -> red (hot / many dogs).
const DEFAULT_GRADIENT = [
  [0.0, 'rgba(33,150,243,0)'],
  [0.25, 'rgba(33,150,243,0.9)'],
  [0.45, 'rgba(76,175,80,0.9)'],
  [0.65, 'rgba(255,235,59,0.9)'],
  [0.85, 'rgba(255,152,0,0.95)'],
  [1.0, 'rgba(244,67,54,1)']
];

function buildGradientLUT(stops) {
  const size = 256;
  const gradCanvas = document.createElement('canvas');
  gradCanvas.width = 1;
  gradCanvas.height = size;
  const ctx = gradCanvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  stops.forEach(([stop, color]) => grad.addColorStop(stop, color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, size);
  return ctx.getImageData(0, 0, 1, size).data;
}

/**
 * Lightweight dependency-free Leaflet heatmap layer for react-leaflet v4.
 * Renders `points` (each { lat, lng, weight? }) as a density heatmap,
 * so places with many overlapping dog sightings glow red/orange while
 * isolated sightings stay blue/green.
 */
export default function HeatmapLayer({ points = [], radius = 30, blur = 22, maxIntensity }) {
  const map = useMap();
  const stateRef = useRef({});

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = 450;

    map.getPanes().overlayPane.appendChild(canvas);

    const blob = createBlobCanvas(radius, blur);
    const lut = buildGradientLUT(DEFAULT_GRADIENT);

    function redraw() {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!points.length) return;

      const half = blob.width / 2;
      const maxW = maxIntensity || points.reduce((m, p) => Math.max(m, p.weight || 1), 1);
      const bounds = map.getBounds().pad(0.15);

      points.forEach((p) => {
        if (!bounds.contains([p.lat, p.lng])) return;
        const pt = map.latLngToContainerPoint([p.lat, p.lng]);
        const intensity = Math.min((p.weight || 1) / maxW, 1);
        ctx.globalAlpha = Math.max(intensity, 0.25);
        ctx.drawImage(blob, pt.x - half, pt.y - half);
      });
      ctx.globalAlpha = 1;

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      for (let i = 3; i < pixels.length; i += 4) {
        const alpha = pixels[i];
        if (!alpha) continue;
        const idx = alpha * 4;
        pixels[i - 3] = lut[idx];
        pixels[i - 2] = lut[idx + 1];
        pixels[i - 1] = lut[idx + 2];
        pixels[i] = lut[idx + 3];
      }
      ctx.putImageData(imgData, 0, 0);
    }

    redraw();
    map.on('move zoom resize', redraw);
    stateRef.current = { canvas, redraw };

    return () => {
      map.off('move zoom resize', redraw);
      // Guard against removing a node that Leaflet has already torn down
      // itself (e.g. when the whole MapContainer unmounts around the same
      // time) - calling removeChild on a node that's no longer attached
      // throws a NotFoundError that used to crash the whole page with no
      // ErrorBoundary in place to catch it.
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points, radius, blur, maxIntensity]);

  return null;
}

HeatmapLayer.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      weight: PropTypes.number
    })
  ),
  radius: PropTypes.number,
  blur: PropTypes.number,
  maxIntensity: PropTypes.number
};
