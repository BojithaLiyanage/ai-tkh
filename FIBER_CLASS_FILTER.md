# Fiber Class Filter Feature

## Overview
Added the ability to filter fibers by their classification (e.g., Natural, Synthetic) in the Compare Tab component.

## Features Implemented

### 1. Multi-Select Filter
- **Type**: Multiple selection dropdown
- **Location**: First control in the controls panel
- **Label**: "Filter by Fiber Class"
- **Placeholder**: "All Classes"
- **Behavior**:
  - When empty, shows all fibers
  - When selected, shows only fibers from chosen classes
  - Supports responsive tag display (maxTagCount="responsive")

### 2. Dynamic Class List
The filter automatically populates with unique fiber classes from the loaded data:
```typescript
const fiberClasses = Array.from(
  new Map(
    data
      .filter(fiber => fiber.fiber_class)
      .map(fiber => [fiber.fiber_class!.name, fiber.fiber_class!])
  ).values()
);
```

### 3. Filtering Logic
Fibers are filtered by:
1. **Class Match**: Must be in selected classes (if any selected)
2. **Property Data**: Must have valid data for the selected property

```typescript
const validData = data.filter(fiber => {
  // If no fiber classes selected, show all fibers
  const classMatches = selectedFiberClasses.length === 0 ||
    (fiber.fiber_class && selectedFiberClasses.includes(fiber.fiber_class.name));

  // Also must have data for the selected property
  const hasPropertyData = getPropertyValue(fiber, selectedProperty) !== null;

  return classMatches && hasPropertyData;
});
```

## UI Layout

### Controls Grid
Changed from 2-column to 3-column layout:

```
[Filter by Fiber Class] [Select Property] [Chart Type]
```

### Responsive Behavior
- **Mobile (1 column)**: Stacks vertically
- **Tablet (2 columns)**: First filter spans 2 columns
- **Desktop (3 columns)**: All controls in one row

## State Management

### New State Variables
```typescript
const [selectedFiberClasses, setSelectedFiberClasses] = useState<string[]>([]);
```

- Type: String array of selected fiber class names
- Default: Empty array (shows all fibers)
- Updated when user selects/deselects classes

## Example Usage

### Scenario 1: Show Only Natural Fibers
1. Click "Filter by Fiber Class" dropdown
2. Select "Natural"
3. Chart updates to show only natural fibers (Cotton, Wool, Silk, Linen, etc.)

### Scenario 2: Compare Natural vs Synthetic
1. Select both "Natural" and "Synthetic" classes
2. Chart shows all fibers from both classes
3. Can easily compare properties across all classes

### Scenario 3: Clear Filter
1. Click the X icon on selected tags or clear all
2. All fibers are shown again

## Fiber Class Data

The filter automatically detects available classes from the API response:

```typescript
{
  fiber_class: {
    id: 1,
    name: "Natural"  // This becomes a filter option
  }
}
```

Example classes that might appear:
- Natural
- Synthetic
- Semi-synthetic
- Plant-based
- Animal-derived

## Integration Points

### Backend
- No backend changes needed
- Filter happens on client-side
- API returns all fibers with class information

### Frontend
- **api.ts**: Already includes `fiber_class` in `FiberComparison` interface
- **CompareTab.tsx**: Added filtering logic and UI

## Performance Considerations

1. **Filtering is fast**: Client-side filtering of ~100 fibers
2. **No extra API calls**: Uses already-fetched data
3. **Deduplication**: Uses Map to get unique classes
4. **Real-time updates**: Chart updates instantly when filter changes

## Files Modified

- `frontend/src/components/CompareTab.tsx`
  - Added `selectedFiberClasses` state
  - Extracted unique `fiberClasses` from data
  - Updated filtering logic to check class match
  - Added Filter UI in controls section
  - Changed grid layout from 2 to 3 columns

## Testing

### Test Cases

1. **Load without filter**
   - ✓ All fibers displayed
   - ✓ No tags selected

2. **Select one class**
   - ✓ Only fibers from that class shown
   - ✓ Tag appears in filter box
   - ✓ Statistics update correctly

3. **Select multiple classes**
   - ✓ Union of all selected classes shown
   - ✓ Multiple tags displayed
   - ✓ Responsive tag count works

4. **Clear filter**
   - ✓ All fibers displayed again
   - ✓ Tags removed
   - ✓ Chart resets

5. **Filter + Property change**
   - ✓ Filter persists when changing property
   - ✓ Chart updates with filtered data for new property

6. **Filter + Chart type change**
   - ✓ Filter persists when changing chart type
   - ✓ Chart displays correctly

## User Experience

### Visual Feedback
- Selected classes shown as tags
- Clear label "Filter by Fiber Class"
- Dropdown shows all available options
- Responsive design adapts to screen size

### Interaction Flow
1. User opens Compare Tab
2. Data loads automatically
3. Filter options populate dynamically
4. User selects class(es)
5. Chart updates instantly
6. User can change property or chart type while filter persists

## Future Enhancements

Potential improvements:
- [ ] Add fiber count badges to class options
- [ ] Add "Select All" / "Clear All" buttons
- [ ] Save filter preferences to localStorage
- [ ] Add filter by multiple properties simultaneously
- [ ] Add search/filter within the class list
- [ ] Show class statistics in tooltips
- [ ] Add animation when filtering
- [ ] Export filtered data to CSV

## Code Changes Summary

**Lines added**: ~40
**Lines modified**: ~15
**New state variables**: 1
**New calculations**: 1 (fiberClasses extraction)
**UI changes**: Grid layout 2→3 columns, added filter dropdown

## Compatibility

- ✓ Works with all existing properties
- ✓ Works with Bar and Line charts
- ✓ Responsive on mobile/tablet/desktop
- ✓ Type-safe with TypeScript
- ✓ No breaking changes to existing functionality
