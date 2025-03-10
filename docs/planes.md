# Tracked Planes

**natuerlich** supports [WebXR Plane Detection Module](https://immersive-web.github.io/real-world-geometry/plane-detection.html) in the form of `TrackedPlane`s. The `useTrackedPlanes` hook allows to retrieve all detected planes. The `TrackedPlane` component takes a single plane and renders the geometry retrieved from the plane. The material of the `TrackedPlane` can be customized using R3F, and further content can be placed as its children.

#### Important:

The `TrackedPlane` component must be placed inside the `ImmersiveSessionOrigin` if an `ImmersiveSessionOrigin` is present. The `useTrackedPlanes` hook must be placed inside the Canvas. Furthermore, the `"plane-detection"` feature must be added to the `sessionOptions` for the [WebXR Plane Detection Module](https://immersive-web.github.io/real-world-geometry/plane-detection.html) to be active if supported by the device.

[CodeSandbox](https://codesandbox.io/s/natuerlich-tracked-planes-lx3l5x?file=/src/app.tsx)

![Screenshot](./tracked-planes.gif)

```tsx
import { XRCanvas } from "@coconut-xr/natuerlich/defaults";
import {
  useEnterXR,
  NonImmersiveCamera,
  ImmersiveSessionOrigin,
  TrackedPlane,
  useTrackedPlanes
} from "@coconut-xr/natuerlich/react";
import { getPlaneId } from "@coconut-xr/natuerlich";

const sessionOptions: XRSessionInit = {
  requiredFeatures: ["local-floor", "plane-detection"]
};

export default function Index() {
  const enterAR = useEnterXR("immersive-ar", sessionOptions);
  const planes = useTrackedPlanes();
  return (
    <div
      style={{...}}
    >
      <button onClick={enterAR}>Enter AR</button>
      <XRCanvas>
        <NonImmersiveCamera position={[0, 1.5, 4]} />
        <ImmersiveSessionOrigin position={[0, 0, 4]}>
          <pointLight position={[0, 1, 0]} intensity={10} />
      {planes.map((plane) => (
        <TrackedPlane plane={plane} key={getPlaneId(plane)}>
          <meshPhongMaterial color="gray" />
        </TrackedPlane>
      ))}
        </ImmersiveSessionOrigin>
      </XRCanvas>
    </div>
  );
}

```

---

If your questions were not yet answered, visit our [Discord](https://discord.gg/NCYM8ujndE) ;)
