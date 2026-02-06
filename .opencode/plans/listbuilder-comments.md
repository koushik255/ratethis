# ListBuilder Comments Integration Plan

## Changes Required

### 1. Update Imports (ListBuilder.tsx:6)
Add CommentSection import:
```typescript
import { CommentSection } from "../components/CommentSection";
```

### 2. Add CommentSection Component (ListBuilder.tsx:~196)
Insert below the anime grid, before the footer:
```tsx
      {/* Comments Section - Below the anime grid */}
      <div className="list-comments-section">
        <CommentSection listId={id!} />
      </div>
```

### 3. Location Details
- Insert at line ~196, after the closing `</div>` of `list-builder-content`
- Before the `showSearchPanel` conditional
- Before the `<footer>` element

### 4. Styling
The CommentSection already has complete CSS in:
- CommentSection.css (brutalist theme)
- CommentForm.css
- ReplyForm.css

No additional styling needed - will inherit existing board styles.

### 5. Testing
- Verify comments load for the list
- Verify new comments can be posted
- Verify replies work
- Verify brutalist styling applies correctly
