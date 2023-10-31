import sqlite3


class Comment:
    score = 0
    area_id: int
    content: str

    def __init__(self, content, area_id):
        self.content = content
        self.area_id = area_id


import sqlite3


class CommentDatabase:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self.cursor.execute(
            "CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, area_id INTEGER NOT NULL, content TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0, time DATETIME DEFAULT (datetime('now', 'localtime')))"
        )
        self.conn.commit()

    def add_comment(self, area_id, content):
        self.cursor.execute(
            "INSERT INTO comments (area_id, content, score) VALUES (?, ?, 0)", (area_id, content)
        )
        self.conn.commit()

    def get_comments(self, area_id):
        self.cursor.execute("SELECT * FROM comments WHERE area_id = ?", (area_id,))
        return self.cursor.fetchall()

    def delete_comment(self, id):
        self.cursor.execute("DELETE FROM comments WHERE id = ?", (id,))
        self.conn.commit()

    def update_score(self, id, is_upvote):
        self.cursor.execute("SELECT score FROM comments WHERE id = ?", (id,))
        score = self.cursor.fetchone()[0]
        if is_upvote:
            score += 1
        else:
            score -= 1
        self.cursor.execute("UPDATE comments SET score = ? WHERE id = ?", (score, id))
        self.conn.commit()

    def close(self):
        self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()


comment_db = CommentDatabase("./data/comments.db")
