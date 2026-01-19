# Prisma Migrations Guide

Quick reference for managing database schema and migrations with Prisma.

## 🧠 Key Principles

1. **Migrations are version control for database schema** - Every schema change must create a migration file
2. **Always commit migration files to git** - Team needs to sync schema changes
3. **Never edit applied migration files** - Create new migrations instead
4. **Development vs Production**:
   - **Development**: Use `db:migrate` to create and apply migrations
   - **Production**: Use `db:migrate:deploy` to only apply migrations (never create new ones)

## 🚀 Quick Start

### Initial Setup

```bash
# Install dependencies (auto-generates Prisma Client)
yarn install

# Initialize database: Create first migration + seed data
yarn db:init
```

### Changing Schema

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply migration
yarn db:migrate

# 3. Commit migration file
git add prisma/migrations/
git commit -m "feat: add new field"
```

## 📁 File Structure

```
prisma/
├── schema.prisma      # Schema definition
├── seed.ts            # Seed data script
└── migrations/        # Migration files (auto-generated)
    └── YYYYMMDDHHMMSS_migration_name/
        └── migration.sql
```

## 🔧 Database Scripts

### `db:init` - Initialize Database

**When to use:** First-time database setup, no migrations exist yet

**What it does:**

- Creates initial "init" migration
- Applies migration to database
- Runs seed script automatically

```bash
yarn db:init
```

**⚠️ Note:** Only run once. Use `db:migrate` for subsequent schema changes.

---

### `db:migrate` - Create & Apply Migration (Development)

**When to use:** After editing `schema.prisma`, need to create new migration file

**What it does:**

- Compares schema.prisma with current database
- Creates new migration file in `prisma/migrations/`
- Applies migration to database
- Generates Prisma Client

```bash
yarn db:migrate
# With custom name:
npx prisma migrate dev --name add_phone_to_user
```

**Workflow:**

1. Edit `schema.prisma`
2. Run `yarn db:migrate`
3. Enter migration name (or use default)
4. **Commit migration file to git**

---

### `db:migrate:deploy` - Deploy Migrations (Production)

**When to use:** Production/staging deployment, CI/CD pipeline

**What it does:**

- Only applies pending migrations
- Does not create new migration files
- Safe for production

```bash
yarn db:migrate:deploy
```

**⚠️ Critical:**

- Migration files must be committed and deployed with code
- **Never run `db:migrate` on production** (only use `db:migrate:deploy`)

---

### `db:reset` - Reset Database (Development Only)

**When to use:** Want to wipe all data and start fresh, testing migrations

**What it does:**

- Drops all tables
- Reapplies all migrations
- Runs seed automatically

```bash
yarn db:reset
```

**⚠️ Warning:** Deletes all data in database!

---

### `db:seed` - Seed Sample Data

**When to use:** Insert sample data for development, after reset

```bash
yarn db:seed
```

---

### `db:studio` - Prisma Studio (Database GUI)

**When to use:** View/edit data directly, debug database issues

```bash
yarn db:studio
```

---

### Prisma Client Generation

**Automatic:** Runs after `yarn install` (postinstall) and after migrations

**Manual (if needed):**

```bash
npx prisma generate
```

## 🔄 Workflows

### Development Workflow

1. Edit `prisma/schema.prisma`
2. Run `yarn db:migrate`
3. Review generated migration SQL
4. Commit migration file to git
5. Push to repository

### Production Deployment

```bash
# In CI/CD or deploy script:
yarn db:migrate:deploy  # Only applies migrations, doesn't create new ones
```

### Team Collaboration

```bash
# After pulling code with new migrations:
git pull

# Apply pending migrations:
yarn db:migrate:deploy
# Or in development:
yarn db:migrate  # Will detect and apply new migrations
```

## ⚠️ Best Practices

### Development

- ✅ Always create migration when changing schema
- ✅ Commit migration files to git
- ✅ Review generated migration SQL before committing
- ✅ Use meaningful migration names
- ✅ Test migrations locally before pushing

### Production

- ✅ Always backup database before deploying migrations
- ✅ **Only use `db:migrate:deploy` on production** (never `db:migrate`)
- ✅ Deploy migrations with code (migration files in codebase)
- ✅ Run migrations before starting application
- ✅ Monitor migration status: `npx prisma migrate status`
- ✅ Never edit applied migration files

## 🐛 Troubleshooting

### Check Migration Status

```bash
npx prisma migrate status
```

### Migration Failed (Development)

```bash
# Reset database (⚠️ deletes all data)
yarn db:reset

# Or resolve manually
npx prisma migrate resolve --applied <migration_name>
```

### Database Connection Error

- Check `DATABASE_URL` in `.env`
- Verify database is running
- Check credentials and network
- Format: `postgresql://user:password@host:port/database?schema=public`

### Schema Drift

```bash
# View differences
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma

# Create migration to sync
yarn db:migrate
```

## 📝 Scripts Summary

| Script              | When to Use          | Function                       |
| ------------------- | -------------------- | ------------------------------ |
| `db:init`           | First-time setup     | Create "init" migration + seed |
| `db:migrate`        | Schema changes (dev) | Create & apply new migration   |
| `db:migrate:deploy` | Production deploy    | Only apply migrations          |
| `db:reset`          | Reset database (dev) | Drop all + reapply + seed      |
| `db:seed`           | Insert sample data   | Run seed script                |
| `db:studio`         | View/edit data       | Open Prisma Studio GUI         |

## 🎯 Quick Reference

```bash
# First-time setup
yarn db:init

# Change schema
yarn db:migrate

# Deploy to production
yarn db:migrate:deploy

# Reset development database
yarn db:reset

# Seed data
yarn db:seed

# View data
yarn db:studio

# Check status
npx prisma migrate status
```

## 📚 Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate vs db push](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production#migrate-vs-db-push)
