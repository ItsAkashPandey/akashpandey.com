"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

if (typeof window !== "undefined") {
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    origWarn(...args);
  };
}

const MODEL = "/models/shiba.glb";

export type PuppyMood =
  | "idle"
  | "alert"
  | "carried"
  | "landing"
  | "sniff"
  | "walk"
  | "attack"
  | "eating"
  | "death"
  | "hitLeft"
  | "hitRight"
  | "gallopJump";

export type ActionType =
  | "jump"
  | "attack"
  | "eating"
  | "death"
  | "gallopJump"
  | "hitLeft"
  | "hitRight";

export type PuppyDrive = {
  /** Where the dog should look, in viewport pixels. */
  pointer: { x: number; y: number };
  /** Screen x of the dog's own feet, so it knows which way to turn. */
  selfX: number;
  selfY: number;
  mood: PuppyMood;
  /** Bumped on every click so the rig can fire a one-shot. */
  pokedAt: number;
  /** Action trigger timestamp. */
  actionAt: number;
  /** Action animation to trigger. */
  actionType: ActionType;
  /** Reduced motion. Holds the idle pose still; the head still turns. */
  calm: boolean;
};

/**
 * Quaternius ships twelve clips, exported twice — once bare and once behind
 * the armature name. Either key can win depending on the exporter, so look up
 * both.
 */
function pickClip(clips: THREE.AnimationClip[], name: string) {
  return (
    clips.find((clip) => clip.name === name) ??
    clips.find((clip) => clip.name.endsWith(`|${name}`))
  );
}

function Shiba({ drive }: { drive: RefObject<PuppyDrive> }) {
  const { scene, animations } = useGLTF(MODEL);

  // SkeletonUtils, not Object3D.clone: a plain clone of a skinned mesh keeps
  // pointing at the original skeleton and the copy never moves.
  const root = useMemo(() => cloneSkinned(scene), [scene]);

  /**
   * Normalising to a unit-tall dog with ample headroom so the camera below
   * keeps ears, head, snout, and tail fully in frame without clipping.
   */
  const fit = useMemo(() => {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const scale = 0.94 / Math.max(size.y, size.z, 1e-6);
    return {
      scale,
      offset: new THREE.Vector3(-centre.x, -box.min.y, -centre.z),
    };
  }, [root]);

  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  const clips = useMemo(
    () => ({
      idle: pickClip(animations, "Idle"),
      alert: pickClip(animations, "Idle_2"),
      sniff: pickClip(animations, "Idle_2_HeadLow"),
      run: pickClip(animations, "Gallop"),
      jump: pickClip(animations, "Jump_ToIdle"),
      gallopJump: pickClip(animations, "Gallop_Jump"),
      walk: pickClip(animations, "Walk"),
      attack: pickClip(animations, "Attack"),
      eating: pickClip(animations, "Eating"),
      death: pickClip(animations, "Death"),
      hitLeft: pickClip(animations, "Idle_HitReact_Left"),
      hitRight: pickClip(animations, "Idle_HitReact_Right"),
    }),
    [animations],
  );

  const bones = useRef<Record<string, THREE.Object3D | undefined>>({});
  useEffect(() => {
    bones.current = {
      head: root.getObjectByName("Head"),
      tail: root.getObjectByName("Tail2"),
    };
  }, [root]);

  const group = useRef<THREE.Group>(null);
  const current = useRef<THREE.AnimationAction | null>(null);
  const activeAction = useRef<THREE.AnimationAction | null>(null);
  const lastActionTime = useRef(0);
  const turn = useRef(0);
  const wag = useRef(0);

  const play = useMemo(() => {
    return (clip: THREE.AnimationClip | undefined, fade = 0.25) => {
      if (!clip) return;
      const next = mixer.clipAction(clip);
      if (next === current.current) return;
      next.reset().setEffectiveWeight(1).fadeIn(fade).play();
      current.current?.fadeOut(fade);
      current.current = next;
    };
  }, [mixer]);

  useEffect(() => {
    play(clips.idle, 0);
    return () => {
      mixer.stopAllAction();
    };
  }, [clips.idle, mixer, play]);

  useFrame((state, delta) => {
    const step = Math.min(delta, 1 / 30);
    const node = group.current;
    const input = drive.current;
    if (!node) return;

    // Fire one-shot animation triggers (jump, attack, eating, death, etc.)
    if (input.actionAt && input.actionAt !== lastActionTime.current) {
      lastActionTime.current = input.actionAt;
      const targetClip = clips[input.actionType] ?? clips.jump;
      if (targetClip) {
        // Fade out the current looping base animation first
        current.current?.fadeOut(0.15);
        current.current = null;
        activeAction.current?.stop();
        activeAction.current = mixer.clipAction(targetClip);
        activeAction.current
          .reset()
          .setLoop(THREE.LoopOnce, 1)
          .setEffectiveWeight(1)
          .fadeIn(0.1)
          .play();
        activeAction.current.clampWhenFinished = true;
      }
    }

    const performingOneShot = Boolean(
      activeAction.current?.isRunning() ||
      (activeAction.current?.clampWhenFinished && activeAction.current?.time < (activeAction.current?.getClip().duration ?? 0))
    );

    // When one-shot ends, clear it and resume base loop
    if (activeAction.current && !activeAction.current.isRunning() && lastActionTime.current > 0) {
      // Only clear if it actually finished (time >= duration)
      const clip = activeAction.current.getClip();
      if (activeAction.current.time >= clip.duration - 0.05) {
        activeAction.current = null;
      }
    }

    if (!performingOneShot && !input.calm) {
      if (input.mood === "carried") play(clips.run);
      else if (input.mood === "walk") play(clips.walk ?? clips.run);
      else if (input.mood === "alert") play(clips.alert ?? clips.idle);
      else if (input.mood === "sniff" || input.mood === "landing")
        play(clips.sniff ?? clips.idle);
      else if (input.mood === "attack") play(clips.attack ?? clips.idle);
      else if (input.mood === "eating") play(clips.eating ?? clips.idle);
      else if (input.mood === "death") play(clips.death ?? clips.idle);
      else play(clips.idle);
    }

    mixer.update(input.calm ? 0 : step);

    const dx = input.pointer.x - input.selfX;
    const dy = input.pointer.y - input.selfY;
    const facing = Math.atan2(dx, 240) * 1.1;
    turn.current = THREE.MathUtils.damp(turn.current, facing, 5, step);
    node.rotation.y = turn.current;

    const rig = bones.current;
    if (rig.head) {
      rig.head.rotation.z += THREE.MathUtils.clamp(dx / 480, -0.45, 0.45);
      rig.head.rotation.x += THREE.MathUtils.clamp(-dy / 540, -0.3, 0.3);
    }

    const speed =
      input.mood === "carried" ? 26 : input.mood === "alert" ? 17 : 8;
    if (!input.calm) wag.current += step * speed;
    if (rig.tail) {
      rig.tail.rotation.z += Math.sin(wag.current) * 0.32;
    }

    const clockTime = state.clock?.getElapsedTime?.() ?? performance.now() / 1000;
    node.position.y =
      performingOneShot || input.calm
        ? 0
        : Math.sin(clockTime * 1.7) * 0.01;
  });

  return (
    <group ref={group} position={[0, -0.5, 0]} scale={fit.scale}>
      <primitive object={root} position={fit.offset} />
    </group>
  );
}

export default function PuppyCanvas({
  drive,
}: {
  drive: RefObject<PuppyDrive>;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.12, 2.5], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <hemisphereLight args={["#fff3e2", "#4b4034", 1.35]} />
      <directionalLight position={[2.4, 3.4, 2.6]} intensity={2.1} />
      <directionalLight
        position={[-2.8, 1.4, -2]}
        intensity={0.7}
        color="#8ecfd6"
      />
      <Suspense fallback={null}>
        <Shiba drive={drive} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL);
