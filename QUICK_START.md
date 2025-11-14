# Quick Start Guide - Compare Tab

## 1. Ensure Database Has Fiber Data

If you need test data:
```bash
cd backend
python scripts/populate_test_fibers.py
```

## 2. Start Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

## 3. Start Frontend
```bash
cd frontend
npm run dev
```

## 4. Access Compare Tab
1. Login to the application
2. Navigate to "Compare Fibers" or similar tab
3. You should see:
   - Loading spinner briefly
   - Chart with fiber data
   - Dropdown with 7 properties
   - Statistics panel

## 5. Test the Features

### Select Different Properties
- Click property dropdown
- Choose: Density, Fineness, Staple Length, Tenacity, Elongation, Moisture Regain, or Elastic Modulus
- Chart updates automatically

### Switch Chart Types
- Toggle between Bar and Line charts
- Statistics stay the same

### Check Statistics
- Maximum value and fiber name
- Minimum value and fiber name
- Average across all fibers
- Range (max - min)

## API Endpoints Used

### Main Endpoint
```
GET /api/fiber/compare
Query params: skip=0, limit=100
Auth: Required (Bearer token via axios)
```

### Service Method
```typescript
fiberApi.getFibersForComparison({ limit: 100 })
```

## File Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes.py          # /fiber/compare endpoint
│   ├── models/
│   │   └── models.py          # Fiber model with elastic_modulus
│   └── schemas/
│       └── schemas.py         # Fiber schemas

frontend/
├── src/
│   ├── components/
│   │   └── CompareTab.tsx     # Main component
│   └── services/
│       └── api.ts            # FiberComparison interface & API call
```

## Troubleshooting

### "No Fiber Data Available"
→ Add fiber data using `populate_test_fibers.py`

### Chart doesn't show
→ Check browser console for errors
→ Verify API endpoint: http://localhost:8000/api/fiber/compare
→ Ensure authentication token is valid

### Loading spinner stuck
→ Check Network tab in DevTools
→ Look for API errors (401, 404, 500)
→ Verify backend is running

### No properties in dropdown
→ Component didn't load correctly
→ Check TypeScript errors
→ Clear browser cache and reload

## API Response Example

```json
[
  {
    "id": 1,
    "fiber_id": "COTTON_001",
    "name": "Cotton",
    "fiber_class": {
      "id": 1,
      "name": "Natural"
    },
    "density_g_cm3": 1.54,
    "fineness_min_um": 15.0,
    "fineness_max_um": 25.0,
    "staple_length_min_mm": 20.0,
    "staple_length_max_mm": 35.0,
    "tenacity_min_cn_tex": 3.5,
    "tenacity_max_cn_tex": 5.0,
    "elongation_min_percent": 3.0,
    "elongation_max_percent": 7.0,
    "moisture_regain_percent": 8.5,
    "elastic_modulus_min_gpa": 5.5,
    "elastic_modulus_max_gpa": 12.6
  }
]
```

## Min/Max Averaging Example

For Fineness property:
- min_um = 15.0
- max_um = 25.0
- **Displayed value = (15.0 + 25.0) / 2 = 20.0 μm**

Same logic applies to: Fineness, Staple Length, Tenacity, Elongation, Elastic Modulus

## Key Changes from Original

| Original | New |
|----------|-----|
| Hardcoded 40 fiber names | Dynamic fiber count from database |
| 3 properties | 7 properties |
| Dummy data generation | Real database queries |
| Manual fetch with token | Axios with auto auth |
| No error handling | Loading & error states |

## Commands Reference

### Run Test Data Script
```bash
cd backend && python scripts/populate_test_fibers.py
```

### View API Directly
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/fiber/compare?limit=10
```

### Check TypeScript Errors
```bash
cd frontend && npm run type-check
```

## Success Indicators

✅ Loading spinner appears when tab opens
✅ Chart displays with fiber data
✅ 7 properties available in dropdown
✅ Statistics panel shows Max, Min, Average, Range
✅ Clicking properties updates chart
✅ Bar and Line chart toggle works
✅ No console errors
✅ No 401 authentication errors

## Need Help?

Refer to detailed documentation:
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `COMPARE_TAB_SETUP.md` - Setup & troubleshooting
- `FINAL_SUMMARY.md` - Complete overview
