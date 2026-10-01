"""
db/load_real_courses.py
Loads 4 real course handouts from courses_seed_data.json into PostgreSQL and MongoDB.
Idempotent and safe to run multiple times.
"""

import json
import os
import sys
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
SEED_FILE = ROOT_DIR / "courses_seed_data.json"
SQL_OUT_FILE = Path(__file__).resolve().parent / "load_real_courses.sql"

# DB Connection URLs
PG_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:password@127.0.0.1:5432/learnai"
)
# Convert asyncpg URL format if needed
if "postgresql+asyncpg://" in PG_URL:
    PG_URL = PG_URL.replace("postgresql+asyncpg://", "postgresql://")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "learnai")


def load_seed_json():
    if not SEED_FILE.exists():
        print(f"ERROR: Could not find seed data file at {SEED_FILE}")
        sys.exit(1)
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_sql_file(data):
    """
    Generates an idempotent SQL script to apply schema adjustments
    and upsert courses, modules, and course_content.
    """
    lines = [
        "-- ============================================================",
        "-- Learning Platform — Real Courses Upsert Script",
        "-- Auto-generated from courses_seed_data.json",
        "-- Safe to re-run multiple times (idempotent ON CONFLICT updates)",
        "-- ============================================================\n",
        "-- 1. Schema update (ensure columns and unique indexes exist)",
        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_code VARCHAR(20) UNIQUE;",
        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits INTEGER;",
        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS coordinator VARCHAR(150);",
        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisite VARCHAR(255);\n",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_modules_course_title ON modules(course_id, title);",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_course_content_module_title ON course_content(module_id, title);\n",
        "-- 2. Upsert courses, modules, and content",
        "DO $$",
        "DECLARE",
        "    v_course_id INTEGER;",
        "    v_module_id INTEGER;",
        "BEGIN"
    ]

    for c in data.get("courses", []):
        code = c["course_code"].replace("'", "''")
        title = c["title"].replace("'", "''")
        desc = (c.get("description") or "").replace("'", "''")
        credits = c.get("credits", 4)
        coordinator = (c.get("coordinator") or "").replace("'", "''")
        prereq = (c.get("prerequisite") or "").replace("'", "''")

        lines.append(f"\n    -- Course: {code} - {title}")
        lines.append(f"    INSERT INTO courses (course_code, title, description, credits, coordinator, prerequisite, instructor_id)")
        lines.append(f"    VALUES ('{code}', '{title}', '{desc}', {credits}, '{coordinator}', '{prereq}', 1)")
        lines.append(f"    ON CONFLICT (course_code) DO UPDATE SET")
        lines.append(f"        title = EXCLUDED.title,")
        lines.append(f"        description = EXCLUDED.description,")
        lines.append(f"        credits = EXCLUDED.credits,")
        lines.append(f"        coordinator = EXCLUDED.coordinator,")
        lines.append(f"        prerequisite = EXCLUDED.prerequisite")
        lines.append(f"    RETURNING id INTO v_course_id;")

        lines.append(f"    IF v_course_id IS NULL THEN")
        lines.append(f"        SELECT id INTO v_course_id FROM courses WHERE course_code = '{code}';")
        lines.append(f"    END IF;\n")

        for idx, m in enumerate(c.get("modules", [])):
            m_title = m["title"].replace("'", "''")
            m_content = (m.get("content") or "").replace("'", "''")

            lines.append(f"    -- Module {idx + 1}: {m_title[:40]}...")
            lines.append(f"    INSERT INTO modules (course_id, title, order_index)")
            lines.append(f"    VALUES (v_course_id, '{m_title}', {idx})")
            lines.append(f"    ON CONFLICT (course_id, title) DO UPDATE SET")
            lines.append(f"        order_index = EXCLUDED.order_index")
            lines.append(f"    RETURNING id INTO v_module_id;")

            lines.append(f"    IF v_module_id IS NULL THEN")
            lines.append(f"        SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title = '{m_title}';")
            lines.append(f"    END IF;\n")

            lines.append(f"    INSERT INTO course_content (module_id, title, content_type, content_text)")
            lines.append(f"    VALUES (v_module_id, '{m_title}', 'text', '{m_content}')")
            lines.append(f"    ON CONFLICT (module_id, title) DO UPDATE SET")
            lines.append(f"        content_type = EXCLUDED.content_type,")
            lines.append(f"        content_text = EXCLUDED.content_text;\n")

    lines.append("END $$;\n")
    lines.append("-- Verification queries")
    lines.append("SELECT course_code, title, credits, coordinator FROM courses ORDER BY id;")
    lines.append("SELECT COUNT(*) AS total_courses FROM courses;")
    lines.append("SELECT COUNT(*) AS total_modules FROM modules;")
    lines.append("SELECT COUNT(*) AS total_course_content FROM course_content;\n")

    SQL_OUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated standalone SQL script: {SQL_OUT_FILE}")


def upsert_postgres(data):
    """Connects to PostgreSQL and applies schema update and data upserts."""
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ImportError:
        print("psycopg2 not installed; skipping live PostgreSQL upsert.")
        return None

    try:
        conn = psycopg2.connect(PG_URL, connect_timeout=3)
        conn.autocommit = False
        cur = conn.cursor(cursor_factory=RealDictCursor)
        print("Connected to PostgreSQL successfully.")
    except Exception as e:
        print(f"Could not connect to PostgreSQL ({e}).")
        print(f"Generated SQL file at {SQL_OUT_FILE} can be executed when PostgreSQL is active.")
        return None

    course_stats = {"inserted": 0, "updated": 0}
    module_count = 0
    content_count = 0
    course_id_map = {}

    try:
        # 1. Apply Schema Migrations
        cur.execute("ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_code VARCHAR(20) UNIQUE;")
        cur.execute("ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits INTEGER;")
        cur.execute("ALTER TABLE courses ADD COLUMN IF NOT EXISTS coordinator VARCHAR(150);")
        cur.execute("ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisite VARCHAR(255);")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_modules_course_title ON modules(course_id, title);")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_course_content_module_title ON course_content(module_id, title);")

        # 2. Upsert Courses
        for c in data.get("courses", []):
            code = c["course_code"]
            title = c["title"]
            desc = c.get("description", "")
            credits = c.get("credits", 4)
            coordinator = c.get("coordinator", "")
            prereq = c.get("prerequisite", "")

            # Check if exists
            cur.execute("SELECT id FROM courses WHERE course_code = %s;", (code,))
            existing = cur.fetchone()

            upsert_course_sql = """
                INSERT INTO courses (course_code, title, description, credits, coordinator, prerequisite, instructor_id)
                VALUES (%s, %s, %s, %s, %s, %s, 1)
                ON CONFLICT (course_code) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    credits = EXCLUDED.credits,
                    coordinator = EXCLUDED.coordinator,
                    prerequisite = EXCLUDED.prerequisite
                RETURNING id, (xmax = 0) AS is_insert;
            """
            cur.execute(upsert_course_sql, (code, title, desc, credits, coordinator, prereq))
            row = cur.fetchone()
            course_id = row["id"]
            is_insert = row["is_insert"] if "is_insert" in row else (existing is None)

            if is_insert:
                course_stats["inserted"] += 1
            else:
                course_stats["updated"] += 1

            course_id_map[code] = course_id

            # 3. Upsert Modules & Course Content
            for idx, m in enumerate(c.get("modules", [])):
                m_title = m["title"]
                m_content = m.get("content", "")

                upsert_module_sql = """
                    INSERT INTO modules (course_id, title, order_index)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (course_id, title) DO UPDATE SET
                        order_index = EXCLUDED.order_index
                    RETURNING id;
                """
                cur.execute(upsert_module_sql, (course_id, m_title, idx))
                m_row = cur.fetchone()
                module_id = m_row["id"]
                module_count += 1

                upsert_content_sql = """
                    INSERT INTO course_content (module_id, title, content_type, content_text)
                    VALUES (%s, %s, 'text', %s)
                    ON CONFLICT (module_id, title) DO UPDATE SET
                        content_type = EXCLUDED.content_type,
                        content_text = EXCLUDED.content_text
                    RETURNING id;
                """
                cur.execute(upsert_content_sql, (module_id, m_title, m_content))
                content_count += 1

        conn.commit()

        # Query final row counts
        cur.execute("SELECT COUNT(*) AS count FROM courses;")
        final_courses = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) AS count FROM modules;")
        final_modules = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) AS count FROM course_content;")
        final_content = cur.fetchone()["count"]

        cur.execute("SELECT course_code, title FROM courses ORDER BY id;")
        loaded_courses = cur.fetchall()

        cur.close()
        conn.close()

        return {
            "course_stats": course_stats,
            "modules_touched": module_count,
            "content_touched": content_count,
            "final_courses": final_courses,
            "final_modules": final_modules,
            "final_content": final_content,
            "loaded_courses": loaded_courses,
            "course_id_map": course_id_map,
        }

    except Exception as e:
        conn.rollback()
        print(f"Error during PostgreSQL upsert: {e}")
        return None


def upsert_mongodb(data, course_id_map=None):
    """
    Upserts course resources (textbooks, references, moocs) into MongoDB course_assets.
    Matched on (courseId, url or title) to prevent duplicates on re-run.
    """
    try:
        import pymongo
    except ImportError:
        print("pymongo not installed; skipping MongoDB upsert.")
        return 0

    try:
        client = pymongo.MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
        # Verify connection
        client.admin.command("ping")
    except Exception as e:
        print(f"Could not connect to MongoDB ({e}); skipping MongoDB upsert.")
        return 0

    # Upsert into learnai and learning_platform databases
    dbs_to_update = [client[MONGO_DB_NAME]]
    if "learning_platform" != MONGO_DB_NAME:
        dbs_to_update.append(client["learning_platform"])

    total_assets_touched = 0

    for db in dbs_to_update:
        collection = db["course_assets"]
        # Ensure compound index for fast lookups
        collection.create_index([("courseId", pymongo.ASCENDING), ("title", pymongo.ASCENDING)])
        collection.create_index([("courseId", pymongo.ASCENDING), ("url", pymongo.ASCENDING)])

        for idx, c in enumerate(data.get("courses", [])):
            code = c["course_code"]
            cid = (course_id_map or {}).get(code, idx + 1)
            resources = c.get("resources", {})

            # 1. Textbooks
            for book in resources.get("textbooks", []):
                doc_filter = {
                    "courseId": cid,
                    "title": book.strip(),
                }
                update_doc = {
                    "$set": {
                        "courseId": cid,
                        "title": book.strip(),
                        "url": "",
                        "type": "reference",
                        "tags": [code, "textbook", "reference"],
                        "uploadedBy": 1,
                        "metadata": {"category": "textbook", "course_code": code},
                    }
                }
                collection.update_one(doc_filter, update_doc, upsert=True)
                total_assets_touched += 1

            # 2. References
            for ref in resources.get("references", []):
                doc_filter = {
                    "courseId": cid,
                    "title": ref.strip(),
                }
                update_doc = {
                    "$set": {
                        "courseId": cid,
                        "title": ref.strip(),
                        "url": "",
                        "type": "reference",
                        "tags": [code, "reference"],
                        "uploadedBy": 1,
                        "metadata": {"category": "reference", "course_code": code},
                    }
                }
                collection.update_one(doc_filter, update_doc, upsert=True)
                total_assets_touched += 1

            # 3. MOOCs
            for mooc in resources.get("moocs", []):
                mooc_url = mooc.strip()
                # Derive title from URL slug or use URL
                slug = mooc_url.rstrip("/").split("/")[-1].replace("-", " ").title()
                title = f"MOOC: {slug}" if slug else mooc_url

                doc_filter = {
                    "courseId": cid,
                    "$or": [{"url": mooc_url}, {"title": title}],
                }
                update_doc = {
                    "$set": {
                        "courseId": cid,
                        "title": title,
                        "url": mooc_url,
                        "type": "reference",
                        "tags": [code, "mooc", "online-course", "reference"],
                        "uploadedBy": 1,
                        "metadata": {"category": "mooc", "course_code": code},
                    }
                }
                collection.update_one(doc_filter, update_doc, upsert=True)
                total_assets_touched += 1

    client.close()
    return total_assets_touched


def main():
    print("=" * 60)
    print("  Learning Platform — Real Courses Loader")
    print("=" * 60)

    data = load_seed_json()
    courses = data.get("courses", [])
    print(f"Loaded {len(courses)} courses from {SEED_FILE.name}:")
    for c in courses:
        print(f" - [{c['course_code']}] {c['title']} ({len(c.get('modules', []))} modules)")

    print("\n[Step 1 & 2] Generating idempotent SQL file...")
    generate_sql_file(data)

    print("\n[Step 3] Executing upserts...")
    pg_result = upsert_postgres(data)

    course_id_map = pg_result["course_id_map"] if pg_result else {
        c["course_code"]: idx + 1 for idx, c in enumerate(courses)
    }

    print("\n[Step 4] Upserting resource assets into MongoDB course_assets...")
    mongo_touched = upsert_mongodb(data, course_id_map)
    print(f"MongoDB course_assets processed: {mongo_touched} documents touched/upserted.")

    print("\n" + "=" * 60)
    print("  LOAD SUMMARY")
    print("=" * 60)

    if pg_result:
        print(f"PostgreSQL Courses Inserted : {pg_result['course_stats']['inserted']}")
        print(f"PostgreSQL Courses Updated  : {pg_result['course_stats']['updated']}")
        print(f"PostgreSQL Modules Touched  : {pg_result['modules_touched']}")
        print(f"PostgreSQL Content Touched  : {pg_result['content_touched']}")
        print(f"MongoDB Assets Touched      : {mongo_touched}")
        print("\nFinal Row Counts:")
        print(f"  courses        : {pg_result['final_courses']}")
        print(f"  modules        : {pg_result['final_modules']}")
        print(f"  course_content : {pg_result['final_content']}")
        print("\nLoaded Course Catalog:")
        for r in pg_result['loaded_courses']:
            print(f"  * [{r['course_code']}] {r['title']}")
    else:
        print("PostgreSQL server was not reachable on localhost:5432.")
        print(f"Idempotent SQL generated at: {SQL_OUT_FILE}")
        print(f"MongoDB course_assets updated : {mongo_touched} documents")
        print("\nAll 4 courses data is prepared in:")
        print(f" - {SQL_OUT_FILE} (for PostgreSQL)")
        print(f" - MongoDB database 'learnai' & 'learning_platform' (collection 'course_assets')")

    print("=" * 60)
    print("Done!")


if __name__ == "__main__":
    main()
