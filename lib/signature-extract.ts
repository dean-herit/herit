// signature-extract.ts
// Assumes <script src="https://docs.opencv.org/4.x/opencv.js"></script> is loaded.
// If using TS, add a global declaration:
declare global {
  var cv: any;
}
export type InputImage =
  | HTMLImageElement
  | HTMLCanvasElement
  | File
  | Blob
  | string;

export interface SignatureOptions {
  /**
   * If true, also returns a desaturated (grayscale) version of the full image.
   * (You'll still get the transparent signature output either way.)
   */
  returnDesaturated?: boolean;
  /** Extra padding (px) around the cropped signature. Default: 12 */
  cropPadding?: number;
  /**
   * Binary thresholding strategy:
   * - "auto": Otsu + adaptive fallback (default)
   * - "otsu": Otsu only
   * - "adaptive": adaptive only
   */
  thresholdMode?: "auto" | "otsu" | "adaptive";
  /**
   * Minimum and maximum connected component area ratios to keep (relative to image area).
   * Helps drop tiny specks and huge background blobs.
   */
  minAreaRatio?: number; // default: 0.00005 (~0.005%)
  maxAreaRatio?: number; // default: 0.35 (35%)
  /**
   * Morphology radius (px) for closing small gaps in strokes. Default: 1–2 works well.
   */
  closeRadius?: number; // default: 2
  /**
   * Optional: invert logic if ink appears white on dark paper (rare). Default: auto-detect.
   */
  forceInvert?: boolean;
}

export interface SignatureResult {
  /** Cropped signature on transparent background */
  canvas: HTMLCanvasElement;
  /** PNG data URL of the transparent signature */
  dataUrl: string;
  /** Bounding box (x,y,w,h) in the original image coordinates */
  bbox: { x: number; y: number; w: number; h: number };
  /** Optional full-image desaturated preview (if returnDesaturated=true) */
  desaturatedCanvas?: HTMLCanvasElement;
}

/** Loads images from File/Blob/URL/HTML elements into an HTMLImageElement */
async function loadToImage(input: InputImage): Promise<HTMLImageElement> {
  if (typeof input === "string") {
    return new Promise((res, rej) => {
      const img = new Image();

      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = (e) => rej(e);
      img.src = input;
    });
  }
  if (input instanceof HTMLImageElement) return input;

  if (input instanceof HTMLCanvasElement) {
    const img = new Image();

    img.src = input.toDataURL("image/png");
    await img.decode?.();

    return img;
  }

  // File/Blob
  const blob = input as Blob;
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadToImage(url);

    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Check if OpenCV is ready */
export function isOpenCVReady(): boolean {
  const cv = (window as any).cv;

  return cv && typeof cv.Mat === "function" && cv.wasmReady;
}

/** Ensure OpenCV is ready before processing */
export async function waitForOpenCV(): Promise<void> {
  if (isOpenCVReady()) {
    return;
  }

  throw new Error("OpenCV is not ready. Please wait a moment and try again.");
}

/** Utility: make a same-sized transparent canvas */
function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");

  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));

  return c;
}

/** Convert BGR Mat to grayscale Mat */
function toGray(src: any): any {
  const gray = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

  return gray;
}

/** Returns true if foreground (ink) should be treated as dark-on-light; false if light-on-dark */
function inferInkIsDark(gray: any): boolean {
  // Heuristic: compare mean of dark vs light halves by simple Otsu pre-threshold
  const tmp = new cv.Mat();

  cv.threshold(gray, tmp, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
  const meanBinary = cv.mean(tmp)[0]; // average of 0/255

  tmp.delete();

  // If binary is mostly white (~>127), white is background => ink is dark
  return meanBinary > 127;
}

/** Combine contours into a single mask with filtering heuristics */
function contoursToMask(
  bin: any,
  srcSize: { width: number; height: number },
  opts: Required<Pick<SignatureOptions, "minAreaRatio" | "maxAreaRatio">>,
): { mask: any; bbox: { x: number; y: number; w: number; h: number } | null } {
  const { width: W, height: H } = srcSize;
  const area = W * H;
  const mask = new cv.Mat.zeros(H, W, cv.CV_8UC1);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(
    bin,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE,
  );

  // Filter by connected component area & aspect heuristics
  const keptRects: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    a: number;
  }> = [];

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const rect = cv.boundingRect(cnt);
    const compArea = rect.width * rect.height;

    const areaRatio = compArea / area;

    if (areaRatio < opts.minAreaRatio || areaRatio > opts.maxAreaRatio)
      continue;

    // Aspect and slenderness: signatures are usually wider than tall
    const aspect = rect.width / Math.max(1, rect.height);

    if (aspect < 1.3 && rect.width < 0.25 * W) {
      // Too square and small — likely noise
      continue;
    }
    keptRects.push({ ...rect, a: compArea });
  }

  if (keptRects.length === 0) {
    contours.delete();
    hierarchy.delete();

    return { mask, bbox: null };
  }

  // Merge overlapping/nearby rects to form one overall region
  // Simple union bbox of all kept rects (robust for signatures spanning multiple words)
  let minX = W,
    minY = H,
    maxX = 0,
    maxY = 0;

  for (const r of keptRects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  }
  const unionRect = new cv.Rect(
    Math.max(0, minX),
    Math.max(0, minY),
    Math.min(W - Math.max(0, minX), maxX - minX),
    Math.min(H - Math.max(0, minY), maxY - minY),
  );

  // Draw all qualifying contours into mask (restrict to unionRect to reduce spurious bits)
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const rect = cv.boundingRect(cnt);
    const compArea = rect.width * rect.height;
    const ratio = compArea / area;

    if (ratio < opts.minAreaRatio || ratio > opts.maxAreaRatio) continue;

    // Draw
    cv.drawContours(mask, contours, i, new cv.Scalar(255), cv.FILLED);
  }

  contours.delete();
  hierarchy.delete();

  return {
    mask,
    bbox: {
      x: unionRect.x,
      y: unionRect.y,
      w: unionRect.width,
      h: unionRect.height,
    },
  };
}

function applyMorphClose(mask: any, radius: number): void {
  const ksize = Math.max(1, Math.floor(radius));
  const kernel = cv.getStructuringElement(
    cv.MORPH_ELLIPSE,
    new cv.Size(ksize, ksize),
  );

  cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);
  kernel.delete();
}

function clampRectToImage(
  rect: { x: number; y: number; w: number; h: number },
  W: number,
  H: number,
  pad: number,
) {
  const x = Math.max(0, rect.x - pad);
  const y = Math.max(0, rect.y - pad);
  const w = Math.min(W - x, rect.w + 2 * pad);
  const h = Math.min(H - y, rect.h + 2 * pad);

  return { x, y, w, h };
}

/**
 * Main entry: takes a photo (any medium), desaturates it, extracts signature ink, and
 * returns a cropped, transparent canvas (PNG).
 */
export async function processSignatureImage(
  input: InputImage,
  options: SignatureOptions = {},
): Promise<SignatureResult> {
  const {
    returnDesaturated = false,
    cropPadding = 12,
    thresholdMode = "auto",
    minAreaRatio = 0.00005,
    maxAreaRatio = 0.35,
    closeRadius = 2,
    forceInvert,
  } = options;

  try {
    await waitForOpenCV();
    const imgEl = await loadToImage(input);

    // Draw the source into RGBA Mat
    const srcCanvas = makeCanvas(
      imgEl.naturalWidth || imgEl.width,
      imgEl.naturalHeight || imgEl.height,
    );
    const ctx = srcCanvas.getContext("2d")!;

    ctx.drawImage(imgEl, 0, 0, srcCanvas.width, srcCanvas.height);

    const src = cv.imread(srcCanvas); // RGBA
    const gray = toGray(src);

    // Optional preview canvas (full desaturated)
    let desatCanvas: HTMLCanvasElement | undefined;

    if (returnDesaturated) {
      desatCanvas = makeCanvas(src.cols, src.rows);
      const desat = new cv.Mat();

      cv.cvtColor(src, desat, cv.COLOR_RGBA2GRAY, 0);
      // Put grayscale back as RGB for preview
      const rgb = new cv.Mat();

      cv.cvtColor(desat, rgb, cv.COLOR_GRAY2RGBA, 0);
      cv.imshow(desatCanvas, rgb);
      desat.delete();
      rgb.delete();
    }

    // Denoise gently to reduce paper texture
    const grayBlur = new cv.Mat();

    cv.bilateralFilter(gray, grayBlur, 5, 55, 55);

    // Threshold
    const bin = new cv.Mat();
    let didThreshold = false;
    const applyOtsu = () => {
      cv.threshold(grayBlur, bin, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
      didThreshold = true;
    };
    const applyAdaptive = () => {
      cv.adaptiveThreshold(
        grayBlur,
        bin,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        25,
        10,
      );
      didThreshold = true;
    };

    if (thresholdMode === "otsu") applyOtsu();
    else if (thresholdMode === "adaptive") applyAdaptive();
    else {
      // auto: try Otsu, fallback to adaptive if result is too uniform
      applyOtsu();
      const meanVal = cv.mean(bin)[0];

      if (meanVal < 10 || meanVal > 245) {
        bin.setTo(new cv.Scalar(0));
        applyAdaptive();
      }
    }
    if (!didThreshold) applyOtsu();

    // Decide foreground polarity (ink dark vs light)
    let inkIsDark = inferInkIsDark(grayBlur);

    if (typeof forceInvert === "boolean") inkIsDark = forceInvert;

    // We want mask where ink == white (255)
    // If ink is dark-on-light background, bin == 0 at ink (because THRESH_BINARY tends to make background white)
    // So invert when needed:
    if (inkIsDark) {
      cv.bitwise_not(bin, bin);
    }

    // Morphologically close small gaps in strokes
    applyMorphClose(bin, closeRadius);

    // Build mask from filtered contours
    const { mask, bbox } = contoursToMask(
      bin,
      { width: src.cols, height: src.rows },
      { minAreaRatio, maxAreaRatio },
    );

    if (!bbox) {
      // Fallback: take entire bin as mask (rare)
      const fullMask = bin.clone();
      const rect = { x: 0, y: 0, w: src.cols, h: src.rows };
      const clamped = clampRectToImage(rect, src.cols, src.rows, cropPadding);
      const out = makeCanvas(clamped.w, clamped.h);
      const outCtx = out.getContext("2d")!;
      // Compose RGBA with mask as alpha
      const roi = src.roi(
        new cv.Rect(clamped.x, clamped.y, clamped.w, clamped.h),
      );
      const roiMask = fullMask.roi(
        new cv.Rect(clamped.x, clamped.y, clamped.w, clamped.h),
      );
      // Convert roi (Mat RGBA) to ImageData
      const tempCanvas = makeCanvas(clamped.w, clamped.h);

      cv.imshow(tempCanvas, roi);
      const imgData = outCtx.createImageData(clamped.w, clamped.h);
      const srcData = tempCanvas
        .getContext("2d")!
        .getImageData(0, 0, clamped.w, clamped.h).data;
      const maskData = new Uint8ClampedArray(clamped.w * clamped.h);

      for (let y = 0; y < clamped.h; y++) {
        for (let x = 0; x < clamped.w; x++) {
          maskData[y * clamped.w + x] = roiMask.ucharPtr(y, x)[0];
        }
      }
      // Copy RGB and apply alpha from mask
      for (let i = 0; i < srcData.length; i += 4) {
        imgData.data[i] = srcData[i];
        imgData.data[i + 1] = srcData[i + 1];
        imgData.data[i + 2] = srcData[i + 2];
        imgData.data[i + 3] = maskData[i / 4]; // alpha
      }
      outCtx.putImageData(imgData, 0, 0);

      // Clean up
      roi.delete();
      roiMask.delete();
      fullMask.delete();
      src.delete();
      gray.delete();
      grayBlur.delete();
      bin.delete();
      mask.delete();
      const dataUrl = out.toDataURL("image/png");

      return {
        canvas: out,
        dataUrl,
        bbox: clamped,
        desaturatedCanvas: desatCanvas,
      };
    }

    // Crop to bbox with padding
    const padded = clampRectToImage(bbox, src.cols, src.rows, cropPadding);

    // Create output canvas (transparent)
    const outCanvas = makeCanvas(padded.w, padded.h);
    const outCtx = outCanvas.getContext("2d")!;

    // Extract ROI
    const roiSrc = src.roi(new cv.Rect(padded.x, padded.y, padded.w, padded.h));
    const roiMask = mask.roi(
      new cv.Rect(padded.x, padded.y, padded.w, padded.h),
    );

    // Convert roiSrc to ImageData via temp canvas
    const temp = makeCanvas(padded.w, padded.h);

    cv.imshow(temp, roiSrc);
    const rgbData = temp
      .getContext("2d")!
      .getImageData(0, 0, padded.w, padded.h).data;

    // Build alpha from roiMask
    const alpha = new Uint8ClampedArray(padded.w * padded.h);

    for (let y = 0; y < padded.h; y++) {
      for (let x = 0; x < padded.w; x++) {
        alpha[y * padded.w + x] = roiMask.ucharPtr(y, x)[0];
      }
    }

    // Compose RGBA with transparent background
    const outImg = outCtx.createImageData(padded.w, padded.h);

    for (let i = 0; i < rgbData.length; i += 4) {
      outImg.data[i] = rgbData[i];
      outImg.data[i + 1] = rgbData[i + 1];
      outImg.data[i + 2] = rgbData[i + 2];
      outImg.data[i + 3] = alpha[i / 4];
    }
    outCtx.putImageData(outImg, 0, 0);

    // Cleanup
    roiSrc.delete();
    roiMask.delete();
    src.delete();
    gray.delete();
    grayBlur.delete();
    bin.delete();
    mask.delete();

    return {
      canvas: outCanvas,
      dataUrl: outCanvas.toDataURL("image/png"),
      bbox: padded,
      desaturatedCanvas: desatCanvas,
    };
  } catch (error) {
    console.error("Error in processSignatureImage:", error);
    // Try to provide a more helpful error message
    if (typeof error === "number") {
      throw new Error(
        `OpenCV error code: ${error}. Please ensure the image is valid and try again.`,
      );
    }
    throw error;
  }
}
