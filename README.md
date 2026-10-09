# The Ascent

An interactive 3D CV. You play a climber scaling a Blender-made sandstone cliff, and every pitch is a chapter of Dylan Jonker's career. The route runs from base camp in Pretoria to a summit in Georgia.

Built with three.js, Blender models and no framework. Works on desktop and mobile.

## What is in it

- **The route:** seven pitches, from data engineering to running tech and operations as CTO and COO, each shown on gym-style boards bolted to the wall
- **Climbing:** a hold graph with two-bone IK for arms and legs, a chalk and pump system, rests on jugs, and a dyno for big reaches
- **Rope and gear:** a harness with quickdraws, press-to-clip protection and a real rope that runs through each clip. Falls are caught by your last clip
- **Hazards:** cliff trees to climb around and birds that attack more often the higher you go
- **Extras:** a roll on the BJJ mat, skills collected as gear, a sky that changes with altitude, and a summit with a church, flag and a circling plane
- **Classic CV:** a plain page for recruiters, always one click away

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` or arrows | Reach for the next hold |
| `E` | Clip into a quickdraw |
| `F` or `Shift` | Dyno to a far hold |
| `C` or `Space` | Chalk up (also scares birds) |
| `R` | Roll, on the mat ledge |
| Route map (left) | Tap a pitch to rope up to it |
| Touch | Stick plus CLIP, CHALK, DYNO and ROLL buttons |

## Stack

- [three.js](https://threejs.org) and Vite
- Blender (`bpy`) scripts for the climber, holds, props, trees and birds, packed with `gltfpack`
- Self-hosted fonts via Fontsource (Bebas Neue and DM Mono)

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Project layout

```
src/
  main.js       wall, holds, climber IK, rope, birds, camera, HUD
  content.js    all CV copy and board text, edit here to change wording
  style.css     HUD, gauges and layout
public/models/  packed .glb models
models/         Blender scripts that generate the models
```

## Rebuilding the models

```bash
pip install bpy
cd models
python3 climber.py && python3 holds.py && python3 props.py && python3 fauna.py
npx gltfpack -i climber_raw.glb -o ../public/models/climber.glb -cc -vpf -vn 8 -vc 8 -kn
```

Repeat the `gltfpack` step for `holds`, `props` and `fauna`.

## Deploying

Static build, deployed to Vercel with `npx vercel --prod`.

## Author

Dylan Jonker. CTO and COO at Vellvii, data and web background, climber, BJJ fan, moving to Tbilisi in January 2027.
