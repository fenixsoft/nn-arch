---
name: Collapsed Block Rendering
description: Support collapsed/miniature rendering for all block types in nn-arch architecture diagrams
type: project
---

# Collapsed Block Rendering Design

**Date:** 2026-05-07
**Status:** Approved

## Background

When rendering complex neural network architectures like GoogLeNet, the Inception modules are often displayed in a collapsed/miniature form to reduce visual complexity while preserving the structural topology. The reference diagram `docs/inception-full.svg` shows this approach: small rectangles represent different branches without text labels, keeping the parallel structure visible but simplified.

Currently, nn-arch only supports `expand: false` for `stack` blocks, which shows the block name with a `×N` repeat count but doesn't render any internal structure.

## Goal

Add support for `expand: "collapsed"` mode for all block types (parallel, residual, stack), rendering simplified internal structure with minimal-sized blocks without text labels.

## Design Decisions

### 1. YAML Syntax

Extend the `expand` attribute to support three states:

```yaml
blocks:
  - name: Inception_3a
    type: parallel
    expand: "collapsed"  # NEW: simplified structure
    branches:
      - {id: branch_1x1, name: "1x1", type: conv, kernel: 1, channels: 64}
      - ...
```

| expand value | Behavior |
|--------------|----------|
| `true` (default) | Full expansion: show all layers with complete parameters |
| `false` | Minimal: show block name + ×N (existing stack behavior) |
| `"collapsed"` | Simplified structure: minimal blocks, no text, preserve topology |

### 2. Visual Rendering

**Unified rules for all block types:**

- **Block size:** Minimal size (approximately 50×30 base, scaled 3x → ~150×90 display)
- **Block content:** No text inside blocks; color only distinguishes layer type
- **Block title:** Block name displayed at top center of container
- **Layout direction:** Inherits from parent layout (horizontal/vertical)

**Per-block rendering:**

| Block Type | Collapsed Rendering |
|------------|---------------------|
| parallel | N minimal blocks side-by-side (horizontal) or stacked (vertical), with fork/merge connection lines preserved |
| residual | Main path blocks + skip connection arc/line, skip type distinguished by color (identity/projection) |
| stack | Single minimal block + "×N" marker below block name |

### 3. Color Scheme

Collapsed blocks use the same color palette as regular layers:

| Layer Type | Fill Color | Stroke Color |
|------------|------------|--------------|
| conv | `#e8f4f8` | `#5ba5d9` |
| pool | `#f0e8f8` | `#a559f0` |
| fc | `#e8f8f0` | `#5bd9a5` |
| default | `#f8f8f8` | `#999999` |

### 4. Size Constants

Add new layout configuration for collapsed blocks:

```javascript
const COLLAPSED_CONFIG = {
  layerWidth: 50,    // vs normal 216
  layerHeight: 30,   // vs normal 126
  layerGap: 10,      // vs normal 27
  blockPadding: 15,  // vs normal 27
  titleGap: 10,      // vs normal 18
};
```

## Implementation Scope

### Files to Modify

1. **src/parser.js**
   - `normalizeBlock()`: Accept `expand: "collapsed"` as string value
   - No validation changes needed (string values already supported)

2. **src/layout.js**
   - Add `COLLAPSED_CONFIG` constants
   - `calculateBlockLayout()`: Branch to collapsed layout calculation when `expand === "collapsed"`
   - New helper: `calculateCollapsedBlockLayout()` for simplified dimension calculations
   - Adjust block container dimensions based on collapsed content

3. **src/svg-generator.js**
   - `generateBlock()`: Handle collapsed mode rendering
   - New function: `generateCollapsedLayer()` - minimal rectangle without text
   - Adjust connection line coordinates for smaller blocks
   - Keep fork/merge/skip connection styles consistent

### Backward Compatibility

- Existing `expand: true` and `expand: false` behaviors unchanged
- New `expand: "collapsed"` is optional; existing YAML files work without modification
- No API changes to external interface

## Testing Plan

1. **Unit tests:**
   - Parser accepts `expand: "collapsed"`
   - Layout calculations produce correct dimensions
   - SVG output contains expected elements

2. **Visual tests:**
   - Parallel block collapsed: verify branch structure preserved
   - Residual block collapsed: verify skip connection visible
   - Stack block collapsed: verify ×N marker present
   - Mixed layout: verify collapsed blocks work in horizontal and vertical layouts

3. **Integration test:**
   - Render GoogLeNet template with collapsed Inception modules
   - Compare visual output to reference style

## Examples

### Parallel Block (Inception Module)

```yaml
- name: Inception_3a
  type: parallel
  expand: "collapsed"
  branches:
    - {id: b1, name: "1x1", type: conv, kernel: 1, channels: 64}
    - [{id: b2r, name: "reduce", type: conv, kernel: 1, channels: 96},
       {id: b2, name: "3x3", type: conv, kernel: 3, channels: 128}]
    - [{id: b3r, name: "reduce", type: conv, kernel: 1, channels: 16},
       {id: b3, name: "5x5", type: conv, kernel: 5, channels: 32}]
    - [{id: b4p, name: "pool", type: pool, kernel: 3},
       {id: b4, name: "proj", type: conv, kernel: 1, channels: 32}]
  merge: concat
```

**Visual output:**
- Container with dashed border
- Title: "Inception_3a" at top
- 4 minimal colored rectangles (blue for conv, purple for pool) arranged horizontally
- Fork connection from top to branch tops
- Merge connection from branch bottoms to bottom

### Residual Block

```yaml
- name: ResBlock
  type: residual
  expand: "collapsed"
  main:
    - {id: c1, name: conv1, type: conv, kernel: 3, channels: 64}
    - {id: c2, name: conv2, type: conv, kernel: 3, channels: 64}
  skip: identity
  merge: add
```

**Visual output:**
- Container with dashed border
- Title: "ResBlock" at top
- 2 minimal blue rectangles stacked vertically (main path)
- Arc or straight line bypassing main path (skip connection)
- Merge point at bottom

### Stack Block

```yaml
- name: EncoderLayers
  type: stack
  expand: "collapsed"
  repeat: 6
  layers:
    - {id: attn, name: Attention, type: attention, heads: 8}
    - {id: ff, name: FFN, type: fc, size: 2048}
```

**Visual output:**
- Container with dashed border
- Title: "EncoderLayers ×6" at top
- Single minimal colored rectangle representing the repeated structure