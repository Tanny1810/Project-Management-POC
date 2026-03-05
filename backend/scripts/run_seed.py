import sys
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.db.session import engine

SEED_FILE = Path('/app/sql/seed_data.sql')


def _load_sql_statements(path: Path) -> list[str]:
    # Use utf-8-sig so SQL files saved with BOM on Windows are parsed correctly.
    raw_sql = path.read_text(encoding='utf-8-sig')
    statements = [stmt.strip() for stmt in raw_sql.split(';') if stmt.strip()]
    return statements


def run_seed() -> None:
    if not SEED_FILE.exists():
        print(f'Seed file not found: {SEED_FILE}')
        return

    statements = _load_sql_statements(SEED_FILE)
    if not statements:
        print('No SQL statements found in seed file.')
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

    print('Seed data ingestion completed.')


if __name__ == '__main__':
    run_seed()
