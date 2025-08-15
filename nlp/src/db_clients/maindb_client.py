import psycopg2
from psycopg2.extras import RealDictCursor
import os

class MainDBClient:
    def __init__(self):
        self.conn = psycopg2.connect(
            host=os.environ["POSTGRES_HOST"],
            port=os.environ["POSTGRES_PORT"],
            user=os.environ["POSTGRES_USER"],
            password=os.environ["POSTGRES_PASSWORD"],
            dbname=os.environ["POSTGRES_MAIN_DB"]
        )

    def query(self, sql, params=None):
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            try:
                return cur.fetchall()
            except psycopg2.ProgrammingError:
                # No results to fetch
                return None

    def execute(self, sql, params=None):
        with self.conn.cursor() as cur:
            cur.execute(sql, params)
        self.conn.commit()

    def close(self):
        self.conn.close()

    def get_chapters_by_book_id(self, book_id):
        return self.query("SELECT id, chapter_number FROM book_chapters WHERE book_id = %s ORDER BY chapter_number ASC", (book_id,))
