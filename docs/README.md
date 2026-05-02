# Auth Service Documentation

## Postman Collection
The file `auth_service_collection.json` contains all the endpoints for the Authentication Service.

### How to use:
1. Open Postman.
2. Click **Import**.
3. Select `auth_service_collection.json`.
4. Run the service using `pnpm dev`.
5. The collection uses two variables:
   - `base_url`: Defaults to `http://localhost:8000`.
   - `auth_token`: Automatically populated when you run the **Register** or **Login** requests.

### Endpoints:
- **Health**: `GET /health` - Service status.
- **Register**: `POST /auth/register` - Create a new user.
- **Login**: `POST /auth/login` - Authenticate and get a token.
- **Get Me**: `GET /auth/me` - Get current user info (Requires Auth).
- **Update Role**: `PATCH /auth/role` - Update user's agile role (Requires Auth).
- **Get Roles**: `GET /auth/roles` - List available agile roles.
- **Get Profile**: `GET /auth/profile` - Get user profile (Requires Auth).
- **Upsert Profile**: `PUT /auth/profile` - Create/Update user profile (Requires Auth).
