// Browser-side image preparation. Phone photos are 5-10 MB; we never upload those.
// Each photo becomes two small JPEGs: a display image and a thumbnail for the grid.
//
// Re-drawing the picture onto a canvas also strips its hidden metadata (EXIF), so
// the GPS position a phone camera records never leaves the device.

export const FULL_MAX_EDGE = 2000;
export const THUMB_MAX_EDGE = 400;
const FULL_QUALITY = 0.85;
const THUMB_QUALITY = 0.8;

export type PhotoPair = { full: Blob; thumb: Blob };

export class ImageReadError extends Error {
    constructor() {
        super("Couldn't read that image");
        this.name = "ImageReadError";
    }
}

// Loading through an <img> element means the browser applies the photo's
// rotation (EXIF orientation) for us, so portrait shots don't end up sideways.
async function loadImage(file: File): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.src = url;
        await img.decode();
        if (!img.naturalWidth || !img.naturalHeight) throw new ImageReadError();
        return img;
    } catch {
        throw new ImageReadError();
    } finally {
        // decode() has finished, so the bitmap is held by the element.
        URL.revokeObjectURL(url);
    }
}

function drawScaled(
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
    maxEdge: number,
): HTMLCanvasElement {
    const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageReadError();
    // JPEG has no transparency; without this a transparent PNG would turn black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new ImageReadError())),
            "image/jpeg",
            quality,
        );
    });
}

export async function makePhotoPair(file: File): Promise<PhotoPair> {
    const img = await loadImage(file);
    const fullCanvas = drawScaled(img, img.naturalWidth, img.naturalHeight, FULL_MAX_EDGE);
    // The thumbnail is made from the already-reduced image: much quicker than
    // scaling the original a second time.
    const thumbCanvas = drawScaled(fullCanvas, fullCanvas.width, fullCanvas.height, THUMB_MAX_EDGE);
    const [full, thumb] = await Promise.all([
        toJpeg(fullCanvas, FULL_QUALITY),
        toJpeg(thumbCanvas, THUMB_QUALITY),
    ]);
    // Release the pixel memory now rather than waiting for garbage collection.
    fullCanvas.width = fullCanvas.height = thumbCanvas.width = thumbCanvas.height = 0;
    return { full, thumb };
}
