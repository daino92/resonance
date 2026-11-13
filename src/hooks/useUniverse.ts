import { useEffect, useRef, useState } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  Raycaster,
  RingGeometry,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { byId, GENRES, ARCS } from '@/data';
import { planetMaterial } from '@/scene';
import {
  createStarPositions,
  settleLabelVisibility,
  layoutLineage,
  type LabelVisibility,
  type RouteEdge,
} from '@/utils';
import { colors, SCENE_COLORS } from '@/theme';

export interface UniverseProps {
  selected: string;
  focused: boolean;
  year: number;
  all: boolean;
  connections: boolean;
  route: string[];
  routeEdges?: RouteEdge[];
  onSelect: (id: string) => void;
}

const featured = ['jazz', 'electronic', 'rnb', 'rock', 'hiphop'];

const positions: Record<string, number[]> = {
  jazz: [0, -1.5, 2],
  electronic: [-6.8, 0.1, 0],
  rnb: [5.5, 2.2, -1],
  rock: [-2.9, 3.6, -3],
  hiphop: [6, -3.5, -2],
};

const roots = GENRES.filter((g) => g.isRoot);

roots
  .filter((g) => !featured.includes(g.id))
  .forEach((g, i) => {
    const a = (i / 11) * Math.PI * 2;

    positions[g.id] = [Math.cos(a) * 13, Math.sin(a) * 7, -10 - (i % 3) * 2];
  });

export const useUniverse = ({
  selected,
  focused,
  year,
  all,
  connections,
  route,
  routeEdges,
  onSelect,
}: UniverseProps) => {
  const host = useRef<HTMLDivElement>(null);

  const state = useRef({
    selected,
    focused,
    year,
    all,
    connections,
    route,
    routeEdges,
    onSelect,
  });

  state.current = {
    selected,
    focused,
    year,
    all,
    connections,
    route,
    routeEdges,
    onSelect,
  };

  const [error, setError] = useState(false);
  const reset = useRef<() => void>(() => {});

  useEffect(() => {
    const container = host.current!;
    let renderer: WebGLRenderer;

    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setError(true);

      return;
    }

    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    container.appendChild(renderer.domElement);

    renderer.domElement.setAttribute(
      'aria-label',
      '3D music atlas. Drag to orbit, scroll to zoom. Use All worlds for keyboard navigation.',
    );

    renderer.domElement.setAttribute('role', 'img');

    const scene = new Scene();
    const camera = new PerspectiveCamera(40, 1, 0.1, 200);

    camera.position.set(0, 1, 22);

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 7;
    controls.maxDistance = 150;
    controls.enablePan = true;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const world = new Group();

    scene.add(world);

    const geometries: BufferGeometry[] = [];
    const materials: Material[] = [];
    const sphere = new SphereGeometry(1, 64, 48);

    geometries.push(sphere);

    const bodies: {
      id: string;
      group: Group;
      mesh: Mesh;
      label: HTMLButtonElement;
      radius: number;
      target: Vector3;
      visibility: LabelVisibility;
    }[] = [];

    const labelLayer = document.createElement('div');

    labelLayer.className = 'world-labels';
    container.appendChild(labelLayer);

    const addBody = (
      id: string,
      radius: number,
      pos: number[],
      moon = false,
    ) => {
      const g = byId[id];
      const group = new Group();

      const material = planetMaterial(
        colors[g.family],
        GENRES.indexOf(g) * 0.27,
      );

      materials.push(material);

      const mesh = new Mesh(sphere, material);

      mesh.scale.setScalar(radius);
      mesh.rotation.z = 0.25;
      group.add(mesh);
      group.position.fromArray(pos);
      world.add(group);

      if ((id === 'rnb' || id === 'classical' || id === 'ambient') && !moon) {
        const geo = new RingGeometry(radius * 1.3, radius * 1.95, 128);

        geometries.push(geo);

        const mat = new MeshBasicMaterial({
          color: colors[g.family],
          side: DoubleSide,
          transparent: true,
          opacity: 0.35,
        });

        materials.push(mat);

        const ring = new Mesh(geo, mat);

        ring.rotation.x = 1.15;
        ring.rotation.y = 0.25;
        group.add(ring);

        for (let k = 0; k < 5; k++) {
          const rg = new RingGeometry(
            radius * (1.34 + k * 0.12),
            radius * (1.36 + k * 0.12),
            128,
          );

          geometries.push(rg);

          const rm = new Mesh(rg, mat);

          rm.rotation.copy(ring.rotation);
          group.add(rm);
        }
      }

      const label = document.createElement('button');

      label.className = 'planet-label' + (moon ? ' moon-label' : '');
      label.textContent = g.name;
      label.setAttribute('aria-label', `Explore ${g.name}`);
      label.onclick = () => state.current.onSelect(id);
      labelLayer.appendChild(label);

      bodies.push({
        id,
        group,
        mesh,
        label,
        radius,
        target: new Vector3(...pos),
        visibility: { visible: true, candidate: true, changedAt: 0 },
      });

      return group;
    };

    for (const g of roots) {
      addBody(
        g.id,
        g.id === 'jazz'
          ? 3.65
          : g.id === 'electronic'
            ? 2.05
            : g.id === 'rnb'
              ? 2.05
              : featured.includes(g.id)
                ? 0.72
                : 0.65,
        positions[g.id],
      );
    }

    for (const g of GENRES.filter((g) => !g.isRoot)) {
      const group = addBody(g.id, 0.25, [0, 0, -40], true);

      group.visible = false;
    }

    const orbitGroup = new Group();

    world.add(orbitGroup);

    for (let i = 0; i < 3; i++) {
      const points = [];

      for (let j = 0; j <= 180; j++) {
        const a = (j / 180) * Math.PI * 2;

        points.push(
          new Vector3(
            Math.cos(a) * (7 + i * 2),
            Math.sin(a) * (3 + i * 0.5) - 0.6,
            Math.sin(a) * 3 - 3,
          ),
        );
      }

      const geo = new BufferGeometry().setFromPoints(points);

      geometries.push(geo);

      const mat = new LineBasicMaterial({
        color: SCENE_COLORS.orbit,
        transparent: true,
        opacity: 0.15,
      });

      materials.push(mat);
      orbitGroup.add(new Line(geo, mat));
    }

    const starGeo = new BufferGeometry();

    starGeo.setAttribute(
      'position',
      new BufferAttribute(createStarPositions(5200), 3),
    );

    geometries.push(starGeo);

    const starMat = new PointsMaterial({
      color: SCENE_COLORS.stars,
      size: 0.13,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    materials.push(starMat);

    const sky = new Points(starGeo, starMat);

    scene.add(sky);

    const linkGroup = new Group();

    world.add(linkGroup);

    let last = '';
    let frame = 0;
    let width = 1;
    let height = 1;
    let flight = false;
    let lastTime = 0;
    const dest = new Vector3();
    const target = new Vector3();
    const projection = new Vector3();

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      startFlight();
    };

    const startFlight = () => {
      flight = true;

      const s = state.current;

      let distance = s.focused
        ? width < 600
          ? 25
          : 19
        : s.all
          ? width < 600
            ? 50
            : 37
          : width < 600
            ? 29
            : 22;

      if (s.route.length) {
        const layout = s.routeEdges
          ? layoutLineage(s.route, s.routeEdges)
          : null;

        const points = layout
          ? [...layout.values()]
          : s.route.map((_, i) => [(i - (s.route.length - 1) / 2) * 3.5, 0, 0]);

        const halfWidth = Math.max(...points.map((p) => Math.abs(p[0]))) + 2;
        const halfHeight = Math.max(...points.map((p) => Math.abs(p[1]))) + 3;

        distance =
          Math.max(
            19,
            halfWidth / (Math.tan(Math.PI / 9) * camera.aspect),
            halfHeight / Math.tan(Math.PI / 9),
          ) * 1.12;
      }

      dest.set(0, s.route.length ? 0 : s.focused ? 0 : 1, distance);
      target.set(0, 0, 0);
    };

    reset.current = () => startFlight();

    const observer = new ResizeObserver(resize);

    observer.observe(container);
    resize();

    const interrupt = () => {
      flight = false;
    };

    controls.addEventListener('start', interrupt);

    const ray = new Raycaster();
    const pointer = new Vector2();
    let down = [0, 0];

    const pointerDown = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };

    const pointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();

      pointer.set(
        ((e.clientX - rect.left) / width) * 2 - 1,
        (-(e.clientY - rect.top) / height) * 2 + 1,
      );

      ray.setFromCamera(pointer, camera);

      const visible = bodies.filter((b) => b.group.visible);
      const hit = ray.intersectObjects(visible.map((b) => b.mesh))[0];

      if (hit) {
        const body = visible.find((b) => b.mesh === hit.object);

        if (body) {
          state.current.onSelect(body.id);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);

    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);

      if (document.hidden) {
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.05);

      lastTime = now;

      const s = state.current;
      const family = byId[s.selected].family;
      const key = `${s.selected}-${s.focused}-${s.all}-${s.connections}-${s.route.join()}-${s.routeEdges?.map((e) => e.from + e.to).join()}`;

      if (last !== key) {
        last = key;
        startFlight();

        for (const child of [...linkGroup.children]) {
          linkGroup.remove(child);

          const line = child as Line;

          line.geometry.dispose();
          (line.material as Material).dispose();
        }

        const lineage = s.routeEdges
          ? layoutLineage(s.route, s.routeEdges)
          : null;

        const moons = GENRES.filter((g) => !g.isRoot && g.family === family);

        for (const b of bodies) {
          const g = byId[b.id];

          if (s.route.length) {
            const index = s.route.indexOf(g.id);

            b.target.fromArray(
              lineage?.get(g.id) || [
                (index - (s.route.length - 1) / 2) * 3.5,
                Math.sin(index * 1.7) * 1.6,
                0,
              ],
            );
          } else if (s.focused) {
            if (g.isRoot) {
              b.target.set(
                g.id === family ? -1.1 : positions[g.id][0] * 2,
                g.id === family ? 0 : positions[g.id][1] * 2,
                g.id === family ? 0 : -35,
              );
            } else {
              const i = moons.indexOf(g);
              const a = (i / Math.max(moons.length, 1)) * Math.PI * 2;

              b.target.set(
                -1.1 + Math.cos(a) * 5.4,
                Math.sin(a) * 3.5,
                -1 + Math.sin(a) * 1.1,
              );
            }
          } else {
            b.target.fromArray(g.isRoot ? positions[g.id] : [0, 0, -40]);
          }
        }

        if (s.route.length) {
          const edges =
            s.routeEdges ||
            s.route
              .slice(1)
              .map((id, i) => ({ from: s.route[i], to: id, type: 'related' }));

          for (const edge of edges) {
            const a = bodies.find((b) => b.id === edge.from)?.target.clone();
            const b = bodies.find((b) => b.id === edge.to)?.target.clone();

            if (!a || !b) {
              continue;
            }

            const mid = a.clone().lerp(b, 0.5);

            mid.y += 0.6;

            const curve = new QuadraticBezierCurve3(a, mid, b);

            const color =
              edge.type === 'fusion'
                ? SCENE_COLORS.fusion
                : SCENE_COLORS.ancestry;

            const geo = new BufferGeometry().setFromPoints(curve.getPoints(40));

            linkGroup.add(
              new Line(
                geo,
                new LineBasicMaterial({
                  color,
                  transparent: true,
                  opacity: 0.7,
                }),
              ),
            );

            const arrow = new Mesh(
              new ConeGeometry(0.1, 0.34, 8),
              new MeshBasicMaterial({ color }),
            );

            arrow.position.copy(curve.getPoint(0.6));

            arrow.quaternion.setFromUnitVectors(
              new Vector3(0, 1, 0),
              curve.getTangent(0.6).normalize(),
            );

            linkGroup.add(arrow);
          }
        } else if (s.connections) {
          for (const e of ARCS.filter(
            (e) =>
              byId[e.from].isRoot &&
              byId[e.to].isRoot &&
              (e.from === s.selected || e.to === s.selected),
          )) {
            const a = bodies.find((b) => b.id === e.from)!.target.clone();
            const b = bodies.find((b) => b.id === e.to)!.target.clone();
            const mid = a.clone().lerp(b, 0.5);

            mid.z += 2;

            const geo = new BufferGeometry().setFromPoints(
              new QuadraticBezierCurve3(a, mid, b).getPoints(60),
            );

            linkGroup.add(
              new Line(
                geo,
                new LineBasicMaterial({
                  color: SCENE_COLORS.ancestry,
                  transparent: true,
                  opacity: 0.6,
                }),
              ),
            );
          }
        }
      }

      const alpha = reduced ? 1 : 1 - Math.exp(-dt * 3.5);

      // Finish camera motion first. Labels and WebGL must use the same camera matrix.
      if (flight) {
        camera.position.lerp(dest, alpha);
        controls.target.lerp(target, alpha);

        if (camera.position.distanceTo(dest) < 0.02) {
          flight = false;
        }
      }

      controls.update();
      camera.updateMatrixWorld();
      sky.position.copy(camera.position);

      // Update every body before testing visibility against any other body.
      for (const body of bodies) {
        const genre = byId[body.id];

        body.group.visible = s.route.length
          ? s.route.includes(genre.id)
          : genre.year <= s.year &&
            (genre.isRoot
              ? s.focused
                ? genre.id === family
                : s.all || featured.includes(genre.id)
              : s.focused && genre.family === family);

        body.group.position.lerp(body.target, alpha);

        for (const ring of body.group.children.slice(1)) {
          ring.visible = !s.route.length;
        }

        const radius = s.route.length
          ? s.routeEdges && body.id === s.selected
            ? 1.1
            : 0.85
          : s.focused && genre.id === family
            ? 2.5
            : body.radius;

        body.mesh.scale.lerp(new Vector3().setScalar(radius), alpha);

        if (!reduced) {
          body.mesh.rotation.y += dt * 0.025;
        }

        body.label.hidden = !body.group.visible;
        body.label.classList.toggle('route-label', !!s.routeEdges);

        const text =
          s.routeEdges && width < 600
            ? String(s.route.indexOf(body.id) + 1).padStart(2, '0')
            : genre.name;

        if (body.label.textContent !== text) {
          body.label.textContent = text;
        }
      }

      const visibleBodies = bodies.filter((body) => body.group.visible);
      const cameraUp = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);

      for (const body of visibleBodies) {
        const center = body.group.position;

        projection.copy(center).project(camera);

        // A screen-space offset stays below the planet at every orbit angle.
        const rim = center
          .clone()
          .addScaledVector(cameraUp, body.mesh.scale.x)
          .project(camera);

        const screenRadius = (Math.abs(rim.y - projection.y) * height) / 2;
        const delta = center.clone().sub(camera.position);
        const distance = delta.length();

        delta.normalize();

        const occluded = visibleBodies.some((other) => {
          if (other === body) {
            return false;
          }

          const offset = other.group.position.clone().sub(camera.position);
          const along = offset.dot(delta);

          // Hysteresis prevents silhouette-edge noise from toggling the label.
          const radius =
            other.mesh.scale.x * (body.visibility.visible ? 0.93 : 1.03);

          return (
            along > 0 &&
            along < distance - radius &&
            offset.lengthSq() - along * along < radius * radius
          );
        });

        const inView =
          projection.z > -1 &&
          projection.z < 1 &&
          Math.abs(projection.x) < 1.08 &&
          Math.abs(projection.y) < 1.08;

        const visible = settleLabelVisibility(
          body.visibility,
          inView && !occluded,
          now,
        );

        const x = (projection.x * 0.5 + 0.5) * width;
        const y = (-projection.y * 0.5 + 0.5) * height + screenRadius + 8;

        body.label.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translateX(-50%)`;
        body.label.style.opacity = visible ? '1' : '0';
        body.label.style.pointerEvents = visible ? 'auto' : 'none';
        body.label.tabIndex = visible ? 0 : -1;
        body.label.setAttribute('aria-hidden', String(!visible));
        body.label.classList.toggle('selected', body.id === s.selected);
      }

      orbitGroup.visible = !s.focused && !s.connections && !s.route.length;
      renderer.render(scene, camera);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);

      for (const child of linkGroup.children) {
        const line = child as Line;

        line.geometry.dispose();
        (line.material as Material).dispose();
      }

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      labelLayer.remove();
    };
  }, []);

  return { host, error, reset };
};
