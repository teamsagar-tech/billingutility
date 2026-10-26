---
name: saasplatform-dev
description: Standard operating procedures and architecture guidelines for adding new functionality to the SaaSPlatform project. MANDATORY to use when creating new features or pages for SaaSPlatform to ensure proper RBAC, routing, and directory structure.
---

# SaaSPlatform Development Standards

When adding new functionality to the SaaSPlatform project (both frontend and backend), you MUST adhere to the following standards, especially regarding Role-Based Access Control (RBAC).

## Backend Guidelines (`Single-Backend`)

1. **Routing and RBAC:**
   - Every new route that requires authorization must use the `requirePermission` middleware from `src/middleware/rbac.js`.
   - Usage: `requirePermission('module_key', 'action')` where `action` is typically `read`, `write`, or `delete`.
   - Example:
     ```javascript
     const { requirePermission } = require('../middleware/rbac');
     router.get('/', requirePermission('new_feature', 'read'), getFeature);
     router.post('/', requirePermission('new_feature', 'write'), createFeature);
     ```
2. **Tenant Isolation:**
   - Ensure the Mongoose schema uses the `tenantIsolationPlugin` from `src/middleware/tenantIsolation.js`.
   - Include `tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }` in your schema definitions.
   
3. **Role Model Updates:**
   - If introducing a completely new module (e.g., `new_feature`), remember that SuperAdmin and Tenant Admin bypass standard checks, but custom roles will need explicit `read`, `write`, `delete` permissions granted via the UI/Role manager.

2. **Frontend Guidelines (`Single-Frontend`)**

1. **Registering New Modules (RBAC):**
   - If you introduce a completely new module (e.g., `new_feature`), you MUST add it to the `MODULES` array in `Single-Frontend/src/pages/Settings/RoleManagement.jsx` so it can be assigned to custom roles.
     ```javascript
     { id: 'new_feature', name: 'New Feature Module' }
     ```

2. **Route Protection (App.jsx):**
   - ALL protected pages in `App.jsx` MUST be wrapped in the `<NavLayout>` component.
   - You MUST pass the `requiredModule` prop to `<NavLayout>` to enforce page-level access control. If the user lacks permission, they will automatically be blocked and shown an Unauthorized view.
     ```jsx
     <Route path="/new-feature" element={
       <NavLayout requiredModule="new_feature" currentRoute={location.pathname} onNavigate={onNavigate}>
         <NewFeaturePage />
       </NavLayout>
     } />
     ```

3. **Dashboard Protection (Dashboard.jsx):**
   - When adding new entry cards to `Single-Frontend/src/pages/Dashboard.jsx`, you MUST include a `module: 'module_key'` property in the item object. The Dashboard automatically filters out cards the user does not have `read` permission for.

4. **Component-Level Protection:**
   - The `useAuth` hook (or `App.jsx` context) provides a `hasPermission(moduleKey, action)` function.
   - Hide or disable UI elements (like edit/delete buttons) if the user lacks specific action permissions:
     ```jsx
     {hasPermission('new_feature', 'delete') && <button>Delete</button>}
     ```

3. **Component Architecture:**
   - Place generic UI components in `src/components`.
   - Place page-level components in `src/pages`.
   - Use existing API fetch utilities (`apiFetch`) passed from the root or contexts.

## Deployment Guidelines

When you are asked to deploy or upload the project (Frontend, Backend, or both) to the remote server, DO NOT create a new deployment script or `expect` file. 

Instead, ALWAYS use the unified deployment script located in the root of the project:
```bash
./deploy.sh
```
This script will automatically:
1. Build the Single-Frontend.
2. Upload the Single-Backend code (and package files).
3. Upload the Single-Frontend dist bundle.
4. Restart the backend PM2 process.

Run this script inside the `/Users/ratan/Developer/SaaSPlatform` directory whenever a deployment to the remote environment is requested.
