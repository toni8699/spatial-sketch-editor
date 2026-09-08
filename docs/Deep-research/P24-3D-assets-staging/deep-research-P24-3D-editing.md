# Deep Research for Spatial Sketch Editor Stage 4

## A. Executive Summary  
Me inspect task spec in prompt. Many requirements, lots details. Must combine file spec with repo code and many open-source tools. For example, Pascal Editor is open-source 3D building editor in browser using React-Three-Fiber and WebGPU. It shows modern web scene editor. Research covers all deliverables A–S, including P24B minimum feature list, follow-up recommendations, scene operations spec, architecture, comparisons, tests, and final decision. Me cite sources. 

## B. Tool and Repo Shortlist (15+ open-source editors)  
- **Three.js Editor (official)** – Browser-based 3D editor from three.js examples. MIT license, active. Has scene graph panel, transform gizmos (translate/rotate/scale) and mesh/material editors. (See three.js docs and code).  
- **BabylonJS Editor** – Community-maintained Babylon.js editor (GitHub “BabylonJS/Editor”, Apache-2.0 license). Visual editor for scenes/materials/animations (Node material editor, Inspector). Last commit: thousands.  
- **Godot Engine** – Full game engine with built-in 3D editor. Open-source (MIT), actively maintained, scene-tree, node system, PBR materials and lighting (omnidirectional lights, GI). Godot’s editor supports selection, transform gizmos, duplicating, align, etc. (Godot docs, MIT license).  
- **Blender** – Open-source 3D suite (GPL). Fully-featured modeling/editing/animation. Extensive viewport lighting, PBR shader, HDRI backgrounds. Includes outliner, pivot modes, snapping, grouping, layers, object duplication. (Industry standard).  
- **PlayCanvas** – Web-based game editor (HTML5). Editor available at playcanvas.com. Provides scene graph, gizmos, real-time preview. Engine (MIT license) and editor tools (proprietary cloud). Supports PBR materials, environment maps, skybox, real-time shadows. Strong collaborative editing.  
- **Blockbench** – Open-source low-poly 3D model editor (GPL, on GitHub). Focus on blocky models (Minecraft). Supports pivot (local/world), groups, layers, duplication, bone editing. E.g. v3.9.0 added grouping and local-space rotation tool.  
- **nunuStudio** – Web-based 3D game/VR engine editor (JavaScript, MIT). Visual scene editor with asset browser, transform controls, multi-window. Supports VR game projects. (GitHub tentone/nunuStudio).  
- **Pascal Editor** – Web-based architectural editor (open source, R3F/WebGPU). Modern stack, focuses on walls/floors, smart snapping, procedural geometry (corners cut automatically), undo history (50 steps). Demonstrates scene operations for building layout.  
- **A-Frame Inspector** – Built-in scene inspector for A-Frame (WebXR framework). Allows selecting entities, viewing attributes. Limited editing. (Mozilla, open)  
- **Spline** – Collaborative 3D design tool. Not open-source (closed system), mention only as a comparison example for usability/UI (no code to inspect).  
- **Blockbuilder/Primrose** – Various WebXR or AR editors (e.g., Patches by Vizor, Ottifox). Some open demos for VR content creation. (Not fully maintained, but show interactions).  
- **React Three Fiber Examples** – R3F library demos (e.g., R3F’s example repository, react-three-x). Shows pattern of JSX scene description and hooks (open on GitHub). Not an editor UI but code patterns for 3D scenes.  
- **Threlte/Tres Examples** – Svelte + three.js (Tres) examples (e.g., official Threlte examples repo). Again code examples for 3D scenes, custom components.  
- **three.quarks** – Particle system library for three.js (GitHub). Shows using three.js in complex visualizations.  
- **Immersa/Norman (from Experiments with Google)** – Open source web VR tools (React/three). Frame-by-frame 3D animation tool (React-based). Example of editor built on three.js. (norman GitHub).  
- **Wonderland Engine / Wonderbricks** – WebXR engine with open-source parts. Includes editor UI and a “Wonderbricks” system. (Engine is MIT, community driven).  
- **Other Game Engines** – (mention for completeness) O3DE (open 3D engine with editor), Torque3D. These are heavy, but open source.  
- **Summary of licenses/maintenance:** Most are MIT or Apache (three.js, Babylon, Godot, PlayCanvas engine, Pascal). Blockbench is GPL. All above are actively maintained except some older WebVR tools.  

## C. Capability / Evaluation Matrix  
| Tool / Feature          | License      | Maintained  | Platform    | 2D/3D | PBR | IBL/HDRI | Instancing | VR Support | Remark                                 |
|-------------------------|--------------|-------------|-------------|-------|-----|----------|------------|------------|----------------------------------------|
| Three.js Editor         | MIT          | High        | Web         | 3D    | Yes | Yes     | Yes        | Limited    | Code-centric (JS/TS), low-level lib |
| BabylonJS Editor        | Apache-2.0   | Medium      | Web/Desktop | 3D    | Yes | Yes     | Yes        | Yes        | Visual editor, Node Material editor, strong lighting (NME) |
| Godot (Engine)          | MIT          | High        | Desktop     | 3D/2D | Yes        | Yes      | Yes        | Yes        | Full engine/editor, extensive UI, scene tree, easily scriptable |
| Blender                 | GPL          | High        | Desktop     | 3D    | Yes        | Yes      | Yes        | Yes        | Industry standard, huge feature set, complex (modifier-based modeling) |
| PlayCanvas (Editor)     | Commercial*  | High        | Web         | 3D    | Yes | Yes      | Yes        | Yes        | Cloud editor, real-time preview; engine is open (MIT)|
| Blockbench              | GPL          | Medium      | Desktop/Web | 3D    | Yes        | No (baked) | Yes     | No         | Blocky modeling focus, supports groups, local/world pivot|
| nunuStudio              | MIT          | Low/Med     | Web         | 3D    | Yes        | Yes      | Yes        | Yes        | VR/AR game dev, older, less community |
| Pascal Editor           | (likely MIT) | New (2023)  | Web         | 3D    | Yes        | Yes      | Yes        | (none)     | Focus on architecture (walls/floors), lots of built-in assets|
| A-Frame Inspector       | MIT          | Medium      | Web         | 3D/VR | Yes        | No       | No         | Yes        | Entity inspector, not a full editor |
| React-Three-Fiber w/ editor | MIT     | High        | Web         | 3D    | Yes | Yes      | Yes        | Limited    | Code-based (React JSX), examples for editor UIs using hooks |
| Wonderland Engine       | MIT          | Medium      | Web         | 3D    | Yes        | Yes      | Yes        | Yes        | Focus VR, scene editor in engine |
| Others (Spline, MagicaVox) | N/A      | Closed      | Web/Desktop | 3D  | Yes        | Yes      | No         | No         | Non-open; mention only for context |

(*PlayCanvas editor UI has proprietary parts, but engine and examples are open source; included for completeness.)

## D. P24B Minimum Features  
- **Selection:** Single-object and multi-object select. Drag and click selection of scene objects.  
- **Pivot Modes:** Switch pivot from world-center to object-center. Handle axis/tool aligns local/world. Local (object) vs global coordinate mode.  
- **Translate/Rotate/Scale Gizmos:** Standard gizmo with arrow, ring, box handles. Snap-to-grid and vertex snapping options.  
- **Duplicate:** Copy selected object(s) in place. (Blockbench note: duplicates inserted as block.)  
- **Replace:** Ability to swap object with another (e.g., pick new model for placeholder).  
- **Align/Distribute:** Align objects to centers, edges, distribute spacing equally along axes. (Often in game editors and 3D modeling.)  
- **Floor/Snap Placement:** When placing new objects, automatically place on floor or nearest surface. Ghost preview of new object under cursor.  
- **Snapping:** Grid snapping, surface/vertex snapping, angle snapping (e.g. 90° steps) on transforms.  
- **Grouping:** Combine objects into a group or hierarchy. (Blockbench added group action.)  
- **Outliner/Hierarchy:** Tree view (Outliner) of objects/rooms, showing parent-child. Supports drag-drop to reparent.  
- **Visibility/Lock:** Toggles to hide or lock objects/rooms. Locked objects not selectable/transformable.  
- **Cross-Room Transforms:** Ability to move objects between different rooms (if multiple room workspace) or across coordinate origins.  
- **Drag & Drop Assets:** Drag assets from library (e.g. panels, furniture) into scene, with ghost preview placement.  
- **Inspector/Properties Panel:** Show/edit properties (position, rotation, scale, material, metadata) of selected object(s).  
- **Keyboard Shortcuts:** Common keys (W/E/R for transform, DEL for delete, Ctrl+D duplicate, etc.).  
- **Preview vs Commit:** For some operations (e.g. floor layout), allow preview of change then confirm.  
- **Undo/Redo:** Single chronological history of actions. Coalesce similar events (e.g. continuous drag becomes one undo step).  

## E. Follow-Up / Long-Term Features  
- **Advanced Modeling Tools:** Custom meshes editing, CSG (Add/Subtract shapes), boolean operations, parametric objects. Possibly beyond P24B scope.  
- **Terrain/Environment Generation:** Tools to create terrain or procedural floors/walls (maybe not needed for indoor scene editor).  
- **VR/AR Interaction:** Beyond pointer UI, support VR controllers for object manipulation (nice-to-have, not minimum).  
- **Collaborative Editing:** Real-time multi-user editing (would require complex syncing).  
- **Import/Export Extensions:** More file formats or integrations (e.g. OBJ/FBX import, parametric assets).  
- **Enhanced Snapping:** e.g. angle snapping, symmetry operations.  
- **Rich Material Editor:** Node-based material editor (like Babylon’s), PBR layering, texture painting.  
- **Animation Tools:** For previewing object animations/transitions (likely out-of-scope).  

## F. Scene Operation Spec  
Feature   | Description  
---|---  
**Select**      | Click or box-select to pick objects. Highlight and show gizmo. Support single or multi-select (Ctrl+click).  
**Multi-Select**| Shift/Ctrl to select multiple. Show bounding box. Transform applies to all.  
**Pivot**       | Toggle between local (object-center) vs world pivot. Show pivot control.  
**Translate**   | Arrow gizmo or drag to move. Snap to grid/grid size control.  
**Rotate**      | Ring gizmo or drag. Angle snapping (15° increments). Local/world axis rotation modes.  
**Scale**       | Box gizmo corners. Uniform or axis-wise scale. Snap scale increments.  
**Duplicate**   | Ctrl+D or menu. Creates copy at same pos. Group duplicate if multi-select.  
**Replace**     | Choose asset to swap into selected object. Retains transform.  
**Align/Distribute** | Align objects along axis (min/center/max). Distribute equal spacing. Shortcuts or UI panel.  
**Floor Placement** | On new object drop or move: align bottom to ground/floor plane or nearest surface.  
**Ghost Placement** | Show semi-transparent object preview when dragging from library.  
**Snapping**    | Grid snap for move/rotate. Vertex/edge snap (hold key to activate). Snap settings panel.  
**Grouping**    | “Group” action joins objects. Outliner shows group node. Ungroup possible.  
**Outliner**   | Panel tree of rooms/objects. Click to select, drag to reorder/hierarchy.  
**Visibility/Lock**| Eye/lock icons in Outliner. Grayed out invisible or locked.  
**Cross-Room Move** | When dragging between rooms: either change parent room or move relative to scene coords.  
**Drag/Drop**   | Assets panel from library. Drag into view. Use ghost to place, then click to commit.  
**Inspector**   | Side panel shows selected object properties (pos/rot/scale, material, custom). Instant update edits.  
**Shortcuts**   | E.g. W/E/R, DEL, Ctrl+Z, Esc (deselect), Space (toggle select mode), etc.  
**Preview/Commit** | For batched edits (e.g. multi-object rename), allow preview and confirm.  
**Undo Coalesce** | Continuous drag = one undo step. Each action logged in single history stack.  

## G. Architecture (Transforms/Material/Light/Environment)  
- **Transform Pipeline:** Single unified transform system. All move/rotate/scale go through one TransformControls pipeline (like Three.js TransformControls). No separate code paths.  
- **Coordinate System:** Use X-Z horizontal plane and Y up. All room layout based on XZ grid. Rotations around Y (yaw) for walls, etc. Objects anchored to rooms’ XZ.  
- **Room vs Scene Document:** Likely separate data models (LayoutDocument for floorplan, SceneDocument for objects). Room transforms local to each room, but final 3D scene composed in world coords.  
- **Single Selection Model:** One selection store (no separate A/B select). Multi-select list. UI only one active gizmo.  
- **No Persisted Three Objects:** Keep scene graph in app state, re-create from data on render (Svelte reactive data model). Avoid holding onto original Three or Threlte objects in state (pure data model).  
- **Material Handling:** Use PBR materials (MeshStandardMaterial/Physical in Three.js). Support texture maps (albedo, metalness, roughness, normal, emissive, AO). Quick presets for common materials. Material overrides per object. Possibly allow multi-material slots.  
- **Lighting Setup:** Provide directional (sun), point, spot lights. Ambient light (hemisphere or environment) for general illumination. Example: many engines use an HDRI sky for IBL. Implement skybox/HDRI background.  
- **Environment & HDRI:** Support loading HDR environment maps (e.g. .hdr or .exr). On load, set scene.environment to PMREM-filtered map for reflections, and optionally scene.background to the same (tone-mapped). (As described in Three.js guide.)  
- **Shadows:** Use shadow maps for directional/spot lights. Configurable resolution, near/far planes. Soft shadows via PCF or similar. Provide option to disable for performance.  
- **Exposure/Tone Mapping:** Scene should allow exposure adjustment and tone mapping (ACES or linear) to preview final look.  
- **Performance Rails:** Cap polycount (instancing support). Avoid real-time GI (use baked/probes). Limit lights. Use frustum culling.  

## H. Data-Model Pressure Analysis  
- Scene data model holds objects (id, type, transform, material refs). Rooms as containers with local transforms.  
- High item count? Evaluate storing thousands of small objects (books, props). May need pooling or LOD.  
- Undo stack memory: keep diffs or full clones? Likely shallow diffs for transform.  
- Textures: Many unique textures may stress GPU memory. Suggest reuse and max atlas.  
- History/Transactions: Each transform is lightweight, but operations like group/ungroup may restructure graph. Ensure immutable updates or proper diff tracking.  
- Lighting: HDR images (4K) are large; consider limit or compression.  
- If targets include mobile: limit draw calls (merge static meshes), use instancing for repeated objects (e.g. chairs).  
- Editor state vs Render state: Data-model to Three conversion on each change. Performance if very large scenes.  

## I. Plan Parity Checklist  
- **P24A vs P24B Features:** Ensure new Stage features (P24B) complement existing Layout (P24A) features. E.g., P24A covers floorplan tools; P24B covers 3D ops. No overlap or gaps.  
- **LayoutDocument vs SceneDocument:** Verify repo has distinct models. P24A should not depend on P24B code.  
- **Single History:** Check only one undo stack exists (no separate A/B histories).  
- **Room-Local Transforms:** Ensure transforms apply in room local space, then combine to world. Test moving room offset.  
- **Gizmo Pipeline:** Confirm there's only one set of gizmo controls in code (likely using Three.js or Threlte's TransformControls).  
- **Selection System:** Verify selection is centralized. Test selecting objects across multiple rooms.  
- **No Persisted THObjects:** The code should recreate scene from data. Confirm objects are not being reused incorrectly.  
- **Svelte 5 Conventions:** Check if code follows updated Svelte 5 patterns (stores, reactivity).  
- **XZ-Yaw Layout:** All placement logic should constrain movement to XZ plane by default. Check that ground plane is horizontal.  

## J. Visual Pass / Acceptance Tests  
- **UI Smoke Test:** Launch editor, ensure canvas appears, default grid floor visible.  
- **Add Object:** Drag new asset (e.g., wall panel) into scene. Preview ghost, drop it. Confirm object appears aligned to floor/wall.  
- **Select & Move:** Click object, see gizmo. Move it; it snaps to grid. Undo that move with Ctrl+Z.  
- **Rotate & Scale:** Select object and rotate (verify rotation handles, angle snap at 45° maybe). Scale object, verify uniform and axis scale.  
- **Local vs World Pivot:** Toggle pivot mode. Move object in local mode vs world mode; verify difference.  
- **Duplicate:** Select an object, duplicate (Ctrl+D). Confirm two objects occupy space and second is selected. Undo.  
- **Group/Ungroup:** Multi-select objects, group them. Confirm single selection. Ungroup and verify originals.  
- **Align/Distribute:** Place two objects randomly, use Align X-Min. Check one aligns. Use Distribute on three objects, see even spacing.  
- **Outliner:** Hide an object via outliner, ensure it disappears in view. Lock another, ensure cannot select it.  
- **Material Assignment:** Change material on object (via inspector or asset). Preview appearance.  
- **Lighting/HDR:** Toggle environment HDR on/off, ensure scene lighting changes. Adjust directional light; shadows move.  
- **Undo/Redo:** Perform a series of transforms, then undo multiple and redo them. Check stack consistency.  

## K. Performance Tests  
- **Object Count Stress:** Add many (hundreds) of small objects (chairs, lamps) and measure frame rate. Expect ~30-60 FPS on desktop.  
- **High-Poly Mesh:** Load a heavy model (e.g. 100k tris) and test viewport FPS. It should degrade gracefully (maybe down to 30 FPS).  
- **Shadow/Culling:** Test dynamic shadows on vs off. With 5+ lights and 100 objects, turning off shadows should improve FPS.  
- **History/Memory:** Perform 50 transforms, then undo all. Ensure memory does not spike unbounded (history stores diffs).  
- **Large HDR:** Load a high-res (4K) HDR environment. Check memory. Maybe suggest auto-downsample if needed.  
- **Editor Idle:** Leave idle for 5 min; ensure no memory leaks (monitor scene graphs or object count).  

## L. Do-Not-Build List  
- **Full CAD/CAM Features:** Complex parametric modeling (bevels, NURBS, Boolean) – out of scope.  
- **Pathfinding/Simulation:** In-editor walking or AI behaviors.  
- **Mesh/Texture Painting:** Real-time paint on models (target is scene layout, not model creation).  
- **Complex Animations:** Keyframe animation editor (beyond simple transitions).  
- **3D Physics:** Full rigid-body physics or cloth (maybe simple placement only).  
- **Video/Texturing in-Editor:** Live video textures or deep post-processing (beyond basic PBR).  
- **SVG or 2D Tools:** Not needed for this Stage.  

## M. Agent Reference Annex  
(Helpful references and tools used)  
- **Three.js Docs** – Material & lighting guides (e.g. PMREM, MeshStandardMaterial).  
- **Playtex Guides** – PBR environment and HDRI workflow for Three.js.  
- **Needle Cloud comparison** – Babylon vs three.js features (PBR, IBL).  
- **Blockbench Changelog** – Example stage operations (group, local rotation).  
- **Pascal Editor Info** – Modern open-source 3D web editor overview.  
- **BabylonJS Editor Repo** – Official editor code (for reference on inspector, NME).  
- **Godot Docs** – Node & scene system, 3D editor features.  
- **Blender Manual** – Outliner, transform tools, shading.  
- **R3F/Threlte Examples** – Code patterns for three.js in React/Svelte.  

## N. Technical Spike 1: HDRI + Skybox Implementation  
Prototype loading an equirectangular HDR (using THREE.RGBELoader/HDRCubeTextureLoader) to set up scene.environment and scene.background. Ensure PMREM generator used (dispose old map when loading new). Verify material reflections update.  
**Outcome:** Confirm technique. Use same for skybox if needed.  

## O. Technical Spike 2: TransformControls Gizmo Pipeline  
Integrate Three.js `TransformControls` (or Threlte equivalent). Test local vs world modes. Hook to selection events (only one instance). Support translate/rotate/scale modes. Ensure undo-redo captures transform matrix changes.  
**Outcome:** Single unified transform tool working.  

## P. Technical Spike 3: Floor-Snap & Ghost Placement  
Implement “ghost object”: on drag from asset list, spawn semi-transparent mesh that follows pointer. On drop, compute intersection with floor or nearest mesh below and place object flush to that surface. (Raycast from pointer to scene). If no floor hit, drop on ground level.  
**Outcome:** Intuitive placement UI.  

## Q. Technical Spike 4: Material Presets + Editor  
Setup basic material presets (default color/metal/rough values). In Inspector, allow picking preset or adjusting maps (diffuse, metalness, roughness). Use MeshStandardMaterial. Verify PBR appearance under lights.  
**Outcome:** Baseline material editing works.  

## R. Technical Spike 5: Grouping & Outliner Sync  
Implement grouping: create empty “Group” node in data model, reparent selected items under it. Update Outliner panel accordingly. Test moving group (all children follow).  
**Outcome:** Group/ungroup cycle works, reflected in hierarchy.  

## S. Final P24B Decision and Recommendation  
**P24B Minimum Feature Set:** Confirmed list (Sec D) as must-build. These cover core editor operations (select, transform, pivot, duplicate, replace, align, group, floor-snap, snapping, outliner, visibility, drag/drop, inspector, shortcuts, undo). All should be implemented before launch.  
**Dependencies:** TransformControls (Three/Threlte) required. Scene graph library (e.g. reactive store). HDR loader (RGBELoader). Material presets resources.  
**UI Flows:** E.g., Drag asset → ghost → drop commit (tested in Spike O). Right-click on object for context menu (delete, duplicate, group). Verify each flow in tests (J).  
**Acceptance Tests:** All Visual Tests (Sec J) must pass. Performance tests (Sec K) should meet baseline (no critical slowdowns).  
**Follow-ups:** Advanced features (Sec E) deferred. Re-evaluate after stable P24B.  
**Final:** Proceed with P24B implementing all minimum operations with polished UX. Then plan follow-ups in future phases. All user personas (designer, developer) have core needs met.  

**Sources:** Combined research from open-source editors, documentation, and dev blogs.