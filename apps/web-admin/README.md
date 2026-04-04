# VEDAS Admin Frontend

## Setup

```bash
npm install
```

Create `apps/web-admin/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

Start dev server:

```bash
npm run dev --workspace web-admin
```

Open:
- `http://localhost:3000`

## Build

```bash
npm run build --workspace web-admin
npm run start --workspace web-admin
```
