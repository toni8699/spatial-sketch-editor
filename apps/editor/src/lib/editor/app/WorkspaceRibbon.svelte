<script lang="ts">
	import type { EditorStore } from '../editor-store.svelte';
	import type { EditorViewState } from './editor-view-state.svelte';
	import type { LayoutPreviewState } from '../layout/layout-preview-state.svelte';
	import { toggleLayoutCeilings } from '../layout/layout-preview-state.svelte';
	import { hasLayoutTransientInteraction, setPlanViewMode, type LayoutInteractionState } from '../layout/layout-interaction';
	import type { CameraPlanState } from '../camera-plan/camera-plan-state.svelte';
	import type { EditorGizmoCapabilities } from '../gizmo/editor-gizmo-policy';
	import LayoutDraftToolbar from '../layout/LayoutDraftToolbar.svelte';
	import CameraPlanToolbar from '../camera-plan/CameraPlanToolbar.svelte';
	import EditorViewportToolbar from '../EditorViewportToolbar.svelte';
	import EditorViewportGridControls from '../EditorViewportGridControls.svelte';
	import { Maximize, Minimize, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-svelte';

	let { store, viewState, layoutPreview, layoutInteraction, cameraPlan, gizmoCapabilities, transformDisabled, onDeleteArrange } : {
		store: EditorStore; viewState: EditorViewState; layoutPreview: LayoutPreviewState;
		layoutInteraction: LayoutInteractionState; cameraPlan: CameraPlanState;
		gizmoCapabilities: EditorGizmoCapabilities | null; transformDisabled: boolean;
		onDeleteArrange?: () => boolean;
	} = $props();
	const canSwitch = $derived(!store.isEditorInteractionActive);
	function choosePlanMode(mode: 'layout' | 'staging') {
		if (mode === layoutInteraction.planViewMode) return;
		if (hasLayoutTransientInteraction(layoutInteraction)) store.cancelLayoutTransaction();
		setPlanViewMode(layoutInteraction, mode);
	}
</script>

<div class="workspace-ribbon" aria-label="Workspace ribbon" style="grid-area:ribbon;">
	<div class="zone-a">
		<div role="group" aria-label="Editor domain" class="segmented">
			{#each ['scene', 'camera'] as domain}
				<button disabled={!canSwitch} aria-pressed={viewState.domain === domain} class:active={viewState.domain === domain}
					onclick={() => { if (canSwitch) viewState.setDomain(domain as 'scene' | 'camera'); }}>{domain === 'scene' ? 'Scene' : 'Camera'}</button>
			{/each}
		</div>
		<div role="group" aria-label="Editor views" class="segmented">
			{#each ['plan', '3d'] as view}
				<button disabled={!canSwitch} aria-pressed={viewState.activeView === view} class:active={viewState.activeView === view}
					onclick={() => { if (canSwitch) viewState.setView(viewState.domain, view as 'plan' | '3d'); }}>{view === 'plan' ? 'Plan' : '3D'}</button>
			{/each}
		</div>
	</div>
	<div class="contextual-tools">
		{#if viewState.activeView === 'plan' && viewState.domain === 'scene'}
			<LayoutDraftToolbar ribbon interaction={layoutInteraction} preview={layoutPreview}
				showViewToggle={false} showPlanModeToggle onPlanModeChange={choosePlanMode}
				{onDeleteArrange}
				onCancelLayoutTransaction={() => store.cancelLayoutTransaction()} />
		{:else if viewState.activeView === 'plan'}
			<CameraPlanToolbar {store} {cameraPlan} />
		{:else}
			<EditorViewportToolbar ribbon {store} context={viewState.domain} {gizmoCapabilities} {transformDisabled}
				showCeilings={layoutPreview.showCeilings} onToggleCeilings={() => toggleLayoutCeilings(layoutPreview)} />
			<EditorViewportGridControls {store} />
		{/if}
	</div>
	<!-- P21.6 Slice C — Zone C: panel visibility (shell chrome, all views).
	     P23.3 — VS Code-style layout control: one icon per panel that
	     collapses/expands it (the glyph itself reports the state), plus the
	     combined focus toggle. Collapse is CSS-grid only; the canvas is never
	     unmounted. Requests during an active gesture defer to gesture end
	     (store-owned). There is no bottom panel in this shell, so the control
	     carries three toggles rather than VS Code's four. -->
	<div class="zone-c" role="group" aria-label="Panel visibility">
		<button type="button" class="ribbon-btn layout-toggle" aria-pressed={store.leftSidePanelCollapsed}
			aria-label={store.leftSidePanelCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
			title={store.leftSidePanelCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
			onclick={() => store.toggleLeftSidePanel()}>
			{#if store.leftSidePanelCollapsed}<PanelLeftOpen size={15} aria-hidden="true" />{:else}<PanelLeftClose size={15} aria-hidden="true" />{/if}
		</button>
		<button type="button" class="ribbon-btn layout-toggle" aria-pressed={store.rightSidePanelCollapsed}
			aria-label={store.rightSidePanelCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
			title={store.rightSidePanelCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
			onclick={() => store.toggleRightSidePanel()}>
			{#if store.rightSidePanelCollapsed}<PanelRightOpen size={15} aria-hidden="true" />{:else}<PanelRightClose size={15} aria-hidden="true" />{/if}
		</button>
		<button type="button" class="ribbon-btn layout-toggle" class:active={store.focusMode} aria-pressed={store.focusMode}
			aria-label="Focus — collapse both sidebars"
			title="Focus — collapse both sidebars ( \ )"
			onclick={() => store.toggleFocusMode()}>
			{#if store.focusMode}<Minimize size={15} aria-hidden="true" />{:else}<Maximize size={15} aria-hidden="true" />{/if}
		</button>
	</div>
</div>

<style>
	.workspace-ribbon { display:flex; height:var(--editor-ribbon-height); min-width:0; box-sizing:border-box; background:var(--editor-bg-row-2); border-bottom:1px solid var(--editor-border-subtle); z-index:20; }
	.zone-a { display:flex; align-items:center; gap:8px; flex:0 0 240px; box-sizing:border-box; padding:0 8px; border-right:1px solid var(--editor-border-subtle); }
	.zone-c { display:flex; align-items:center; gap:2px; flex:0 0 auto; box-sizing:border-box; margin-left:auto; padding:0 8px; border-left:1px solid var(--editor-border-subtle); }
	/* Square icon-only toggles: the glyph carries the state, so no label and a
	   tighter gutter (the VS Code layout-control look). */
	.layout-toggle { justify-content:center; width:26px; height:26px; padding:0; gap:0; }
	/* Row 2 control surfaces (tracks / segmented switches / ribbon-btn) are
	   owned by the P21.5 grammar in styles/controls.css; only shell layout
	   stays here. */
	.contextual-tools { display:flex; align-items:center; gap:6px; flex:1; min-width:0; padding:0 8px; }
</style>
