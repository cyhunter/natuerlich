import { useFrame, useStore, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { XRImageTrackingResult, useXR } from "./state.js";
import { shallow } from "zustand/shallow";

export * from "./use-enter-xr.js";
export * from "./use-session-grant.js";
export * from "./space.js";
export * from "./guards/index.js";
export * from "./listeners.js";
export * from "./controller.js";
export * from "./hand.js";
export * from "./state.js";
export * from "./anchor.js";
export * from "./session-origin.js";
export * from "./anchor.js";
export * from "./camera.js";
export * from "./layers/index.js";
export * from "./plane.js";
export * from "./image.js";
export * from "./background.js";
export * from "./pose.js";

export function useNativeFramebufferScaling(): number | undefined {
  return useXR((state) =>
    state.session == null ? undefined : XRWebGLLayer.getNativeFramebufferScaleFactor(state.session),
  );
}

export function useAvailableFrameRates(): Float32Array | undefined {
  return useXR(
    (state) => (state.session == null ? undefined : state.session.supportedFrameRates),
    shallow,
  );
}

export function useHeighestAvailableFrameRate(): number | undefined {
  const framerates = useAvailableFrameRates();
  return useMemo(() => {
    if (framerates == null) {
      return;
    }
    return Math.max(...framerates);
  }, [framerates]);
}

export type XRProps = {
  foveation?: number;
  frameRate?: number;
  referenceSpace?: XRReferenceSpaceType;
  frameBufferScaling?: number;
};

/**
 * must be positioned somewhere inside the canvas
 */
export function XR({
  foveation = 0,
  frameRate,
  referenceSpace = "local-floor",
  frameBufferScaling,
}: XRProps) {
  const xrManager = useThree((state) => state.gl.xr);
  const store = useStore();

  useEffect(() => useXR.getState().setStore(store), [store]);

  useEffect(() => {
    xrManager.setFoveation(foveation);
  }, [xrManager, foveation]);

  useEffect(() => {
    if (frameRate == null) {
      return;
    }
    return useXR.subscribe((state, prevState) => {
      if (state.session === prevState.session || state.session == null) {
        return;
      }
      state.session.updateTargetFrameRate(frameRate).catch(console.error);
    });
  }, [frameRate]);

  useEffect(() => {
    if (frameBufferScaling == null) {
      return;
    }
    xrManager.setFramebufferScaleFactor(frameBufferScaling);
  }, [xrManager, frameBufferScaling]);

  useEffect(() => {
    xrManager.setReferenceSpaceType(referenceSpace);
  }, [xrManager, referenceSpace]);

  useFrame((_state, _delta, frame: XRFrame | undefined) => {
    const { trackedImages, requestedTrackedImages } = useXR.getState();
    if (
      trackedImages == null ||
      requestedTrackedImages == null ||
      requestedTrackedImages.length === 0
    ) {
      return;
    }
    trackedImages.clear();
    if (frame == null || !("getImageTrackingResults" in frame)) {
      return;
    }
    const results = (frame.getImageTrackingResults as () => ReadonlyArray<XRImageTrackingResult>)();
    for (const result of results) {
      trackedImages.set(result.index, result);
    }
  });

  return null;
}
