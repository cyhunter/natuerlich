import { XIntersection } from "@coconut-xr/xinteraction";
import { InputDeviceFunctions, XStraightPointer } from "@coconut-xr/xinteraction/react";
import React, { ReactNode, Suspense, useRef, useMemo } from "react";
import { DynamicHandModel, HandBoneGroup } from "../react/hand.js";
import { useInputSourceEvent } from "../react/listeners.js";
import { SpaceGroup } from "../react/space.js";
import {
  ColorRepresentation,
  Mesh,
  Vector3,
  Event,
  PositionalAudio as PositionalAudioImpl,
} from "three";
import {
  CursorBasicMaterial,
  PositionalAudio,
  RayBasicMaterial,
  updateColor,
  updateCursorTransformation,
  updateRayTransformation,
} from "./index.js";
import { ThreeEvent, createPortal, useThree } from "@react-three/fiber";

const negZAxis = new Vector3(0, 0, -1);

/**
 * hand for pointing objects when the pinch gesture is detected
 * includes a cursor and ray visualization
 */
export function PointerHand({
  hand,
  inputSource,
  id,
  children,
  filterIntersections,
  cursorColor = "white",
  cursorPressColor = "blue",
  cursorOpacity = 0.5,
  cursorSize = 0.1,
  cursorVisible = true,
  rayColor = "white",
  rayPressColor = "blue",
  rayMaxLength = 1,
  rayVisibile = true,
  raySize = 0.005,
  cursorOffset = 0.01,
  childrenAtJoint = "wrist",
  pressSoundUrl = "https://coconut-xr.github.io/xsounds/plop.mp3",
  pressSoundVolume = 0.3,
  ...rest
}: {
  hand: XRHand;
  inputSource: XRInputSource;
  children?: ReactNode;
  id: number;
  cursorColor?: ColorRepresentation;
  cursorPressColor?: ColorRepresentation;
  cursorOpacity?: number;
  cursorSize?: number;
  cursorVisible?: boolean;
  rayColor?: ColorRepresentation;
  rayPressColor?: ColorRepresentation;
  rayMaxLength?: number;
  rayVisibile?: boolean;
  raySize?: number;
  filterIntersections?: (intersections: XIntersection[]) => XIntersection[];
  cursorOffset?: number;
  childrenAtJoint?: XRHandJoint;
  onPointerDownMissed?: ((event: ThreeEvent<Event>) => void) | undefined;
  onPointerUpMissed?: ((event: ThreeEvent<Event>) => void) | undefined;
  onClickMissed?: ((event: ThreeEvent<Event>) => void) | undefined;
  pressSoundUrl?: string;
  pressSoundVolume?: number;
}) {
  const sound = useRef<PositionalAudioImpl>(null);

  const pointerRef = useRef<InputDeviceFunctions>(null);
  const pressedRef = useRef(false);
  const cursorRef = useRef<Mesh>(null);
  const rayRef = useRef<Mesh>(null);

  const cursorMaterial = useMemo(
    () => new CursorBasicMaterial({ transparent: true, toneMapped: false }),
    [],
  );
  cursorMaterial.opacity = cursorOpacity;
  updateColor(pressedRef.current, cursorMaterial, cursorColor, cursorPressColor);

  const rayMaterial = useMemo(
    () => new RayBasicMaterial({ transparent: true, toneMapped: false }),
    [],
  );

  updateColor(pressedRef.current, rayMaterial, rayColor, rayPressColor);

  useInputSourceEvent(
    "selectstart",
    inputSource,
    (e) => {
      if (cursorRef.current?.visible && sound.current != null) {
        sound.current.play();
      }
      pressedRef.current = true;
      updateColor(pressedRef.current, rayMaterial, rayColor, rayPressColor);
      updateColor(pressedRef.current, cursorMaterial, cursorColor, cursorPressColor);
      pointerRef.current?.press(0, e);
    },
    [],
  );
  useInputSourceEvent(
    "selectend",
    inputSource,
    (e) => {
      pressedRef.current = false;
      updateColor(pressedRef.current, rayMaterial, rayColor, rayPressColor);
      updateColor(pressedRef.current, cursorMaterial, cursorColor, cursorPressColor);
      pointerRef.current?.release(0, e);
    },
    [],
  );

  const scene = useThree(({ scene }) => scene);

  return (
    <>
      <Suspense>
        <DynamicHandModel hand={hand} handedness={inputSource.handedness}>
          {children != null && <HandBoneGroup joint={childrenAtJoint}>{children}</HandBoneGroup>}
        </DynamicHandModel>
      </Suspense>
      <SpaceGroup space={inputSource.targetRaySpace}>
        <XStraightPointer
          onIntersections={(intersections) => {
            if (cursorVisible) {
              updateCursorTransformation(inputSource, intersections, cursorRef, cursorOffset);
            }
            if (rayVisibile) {
              updateRayTransformation(intersections, rayMaxLength, rayRef);
            }
          }}
          direction={negZAxis}
          filterIntersections={filterIntersections}
          id={id}
          ref={pointerRef}
          {...rest}
        />
        <mesh
          visible={rayVisibile}
          scale-x={raySize}
          scale-y={raySize}
          material={rayMaterial}
          ref={rayRef}
          renderOrder={inputSource.handedness === "left" ? 3 : 4}
        >
          <boxGeometry />
        </mesh>
      </SpaceGroup>
      {createPortal(
        <mesh
          renderOrder={inputSource.handedness === "left" ? 1 : 2}
          visible={cursorVisible}
          scale={cursorSize}
          ref={cursorRef}
          material={cursorMaterial}
        >
          <Suspense>
            <PositionalAudio url={pressSoundUrl} volume={pressSoundVolume} ref={sound} />
          </Suspense>
          <planeGeometry />
        </mesh>,
        scene,
      )}
    </>
  );
}
