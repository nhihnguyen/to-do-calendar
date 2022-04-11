-- Up
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    username STRING UNIQUE,
    password STRING
);

CREATE TABLE authtokens (
    token STRING,
    user_id INTEGER REFERENCES users (user_id),
    PRIMARY KEY (token)
);

CREATE TABLE tasks (
    task_id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    user_id INTEGER,
    task_desc TEXT,
    is_complete BOOLEAN,
    FOREIGN KEY(user_id) REFERENCES users (user_id)
);

-- Down
DROP TABLE users;
DROP TABLE authtokens;
DROP TABLE tasks; 