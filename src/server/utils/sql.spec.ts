import { describe, it, expect } from 'vitest';
import { validateSqlIsQuery } from './sql.js';

describe('validateSqlIsQuery', () => {
  describe('MySQL', () => {
    it('should return true for valid SELECT query', () => {
      const sql = 'SELECT * FROM users';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return true for SELECT query with WHERE clause', () => {
      const sql = 'SELECT id, name FROM users WHERE age > 18';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return true for SELECT query with JOIN', () => {
      const sql =
        'SELECT u.name, o.total FROM users u LEFT JOIN orders o ON u.id = o.user_id';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return true for SELECT query with GROUP BY', () => {
      const sql =
        'SELECT category, COUNT(*) as count FROM products GROUP BY category';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return true for SELECT query with subquery', () => {
      const sql =
        'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return false for INSERT statement', () => {
      const sql =
        'INSERT INTO users (name, email) VALUES ("John", "john@example.com")';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for UPDATE statement', () => {
      const sql = 'UPDATE users SET name = "Jane" WHERE id = 1';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for DELETE statement', () => {
      const sql = 'DELETE FROM users WHERE id = 1';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for DROP TABLE statement', () => {
      const sql = 'DROP TABLE users';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for CREATE TABLE statement', () => {
      const sql = 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255))';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for TRUNCATE statement', () => {
      const sql = 'TRUNCATE TABLE users';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });
  });

  describe('PostgreSQL', () => {
    it('should return true for valid SELECT query', () => {
      const sql = 'SELECT * FROM users';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return true for SELECT query with WHERE clause', () => {
      const sql = 'SELECT id, name FROM users WHERE age > 18';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return true for SELECT query with JOIN', () => {
      const sql =
        'SELECT u.name, o.total FROM users u LEFT JOIN orders o ON u.id = o.user_id';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return true for SELECT query with LIMIT and OFFSET', () => {
      const sql = 'SELECT * FROM users LIMIT 10 OFFSET 20';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return true for SELECT query with CTE', () => {
      const sql =
        'WITH active_users AS (SELECT * FROM users WHERE active = true) SELECT * FROM active_users';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should return false for INSERT statement', () => {
      const sql =
        "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')";
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for UPDATE statement', () => {
      const sql = "UPDATE users SET name = 'Jane' WHERE id = 1";
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for DELETE statement', () => {
      const sql = 'DELETE FROM users WHERE id = 1';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for DROP TABLE statement', () => {
      const sql = 'DROP TABLE users';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });

    it('should return false for ALTER TABLE statement', () => {
      const sql = 'ALTER TABLE users ADD COLUMN age INT';
      expect(validateSqlIsQuery(sql)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const sql = '';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should handle whitespace only', () => {
      const sql = '   ';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should handle case-insensitive SELECT', () => {
      const sql = 'select * from users';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });

    it('should handle SELECT with multiple whitespaces', () => {
      const sql = 'SELECT    *    FROM    users';
      expect(validateSqlIsQuery(sql)).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    describe('Subquery with dangerous operations', () => {
      it('should reject SELECT with DROP TABLE in subquery', () => {
        const sql =
          'SELECT * FROM users WHERE id = (SELECT 1; DROP TABLE users; --)';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject SELECT with DELETE in subquery', () => {
        const sql =
          'SELECT * FROM users WHERE id IN (DELETE FROM users WHERE 1=1)';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject SELECT with UPDATE in subquery', () => {
        const sql =
          'SELECT * FROM users WHERE id = (UPDATE users SET admin=1 WHERE id=1)';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject SELECT with INSERT in subquery', () => {
        const sql =
          'SELECT * FROM users WHERE id IN (INSERT INTO users VALUES (999, "hacker"))';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject SELECT with TRUNCATE in subquery', () => {
        const sql = 'SELECT * FROM users WHERE 1=1 AND (TRUNCATE TABLE users)';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('UNION-based injection', () => {
      it('should reject UNION with DROP TABLE', () => {
        const sql =
          'SELECT * FROM users UNION SELECT NULL; DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject UNION with DELETE', () => {
        const sql =
          'SELECT id, name FROM users UNION DELETE FROM users WHERE 1=1';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject UNION with UPDATE', () => {
        const sql =
          'SELECT * FROM users UNION UPDATE users SET password="hacked"';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Multi-statement injection', () => {
      it('should reject multiple statements with semicolon (DROP)', () => {
        const sql = 'SELECT * FROM users; DROP TABLE users;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject multiple statements with semicolon (DELETE)', () => {
        const sql = 'SELECT * FROM users; DELETE FROM users WHERE 1=1;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject multiple statements with semicolon (UPDATE)', () => {
        const sql = 'SELECT * FROM users; UPDATE users SET admin=1;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject multiple statements (INSERT)', () => {
        const sql =
          'SELECT * FROM users; INSERT INTO users (name) VALUES ("attacker");';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Comment-based injection', () => {
      it('should reject injection with inline comment hiding DROP', () => {
        const sql = 'SELECT * FROM users WHERE 1=1 /* */ OR DROP TABLE users';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject injection with line comment (MySQL)', () => {
        const sql =
          'SELECT * FROM users WHERE id = 1 -- comment\nDROP TABLE users';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject injection with hash comment (MySQL)', () => {
        const sql =
          'SELECT * FROM users WHERE id = 1 # comment\nDELETE FROM users';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('PostgreSQL specific injections', () => {
      it('should reject pg_sleep with malicious query', () => {
        const sql =
          'SELECT * FROM users WHERE id = 1 AND 1=(SELECT 1 FROM pg_sleep(10)); DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject COPY command injection', () => {
        const sql =
          "SELECT * FROM users; COPY users TO '/tmp/users.csv' DELIMITER ',';";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject CREATE FUNCTION injection', () => {
        const sql =
          'SELECT * FROM users; CREATE FUNCTION malicious() RETURNS void AS $$ BEGIN DROP TABLE users; END; $$ LANGUAGE plpgsql;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Encoded and obfuscated injections', () => {
      it('should reject hex-encoded injection attempts', () => {
        const sql =
          'SELECT * FROM users WHERE name = 0x61646D696E; DROP TABLE users;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject injection with CHAR function', () => {
        const sql =
          'SELECT * FROM users; EXEC(CHAR(68,82,79,80,32,84,65,66,76,69));';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Stored procedure and function injections', () => {
      it('should reject CALL statement with stored procedure', () => {
        const sql = 'SELECT * FROM users; CALL drop_all_tables();';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject EXECUTE statement', () => {
        const sql = "SELECT * FROM users; EXECUTE 'DROP TABLE users';";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject DO block (PostgreSQL)', () => {
        const sql =
          'SELECT * FROM users; DO $$ BEGIN DROP TABLE users; END $$;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Database modification operations', () => {
      it('should reject CREATE DATABASE', () => {
        const sql = 'SELECT 1; CREATE DATABASE malicious;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject DROP DATABASE', () => {
        const sql = 'SELECT * FROM users; DROP DATABASE production;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject ALTER DATABASE', () => {
        const sql = 'SELECT 1; ALTER DATABASE production RENAME TO hacked;';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject GRANT privileges', () => {
        const sql =
          'SELECT * FROM users; GRANT ALL PRIVILEGES ON *.* TO "attacker"@"localhost";';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Complex nested subquery injections', () => {
      it('should reject deeply nested subquery with DROP', () => {
        const sql =
          'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE product_id IN (SELECT id FROM products; DROP TABLE products; --))';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject nested subquery with UPDATE in inner query', () => {
        const sql =
          'SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE user_id = users.id AND (UPDATE users SET admin=1))';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject triple-nested subquery with DELETE', () => {
        const sql =
          'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE order_id IN (SELECT id FROM shipments WHERE 1=1; DELETE FROM shipments; --))';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject correlated subquery with injection', () => {
        const sql =
          'SELECT * FROM users u WHERE (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id; DROP TABLE orders; --) > 0';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject nested EXISTS with DROP', () => {
        const sql =
          'SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE EXISTS (SELECT 1; DROP TABLE users; --))';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('CTE (Common Table Expression) injections', () => {
      it('should reject CTE with DROP in definition', () => {
        const sql =
          'WITH malicious AS (SELECT * FROM users; DROP TABLE users; --) SELECT * FROM malicious';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject CTE with UPDATE in definition', () => {
        const sql =
          'WITH updated AS (UPDATE users SET admin=1 RETURNING *) SELECT * FROM updated';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject CTE with DELETE in definition', () => {
        const sql =
          'WITH deleted AS (DELETE FROM users WHERE id > 100 RETURNING *) SELECT * FROM deleted';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject multiple CTEs with injection', () => {
        const sql =
          'WITH cte1 AS (SELECT * FROM users), cte2 AS (SELECT * FROM orders; DROP TABLE orders; --) SELECT * FROM cte1, cte2';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject recursive CTE with injection', () => {
        const sql =
          'WITH RECURSIVE cte AS (SELECT 1; DROP TABLE users; -- UNION ALL SELECT n+1 FROM cte WHERE n < 5) SELECT * FROM cte';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('UNION-based complex injections', () => {
      it('should reject UNION ALL with DROP', () => {
        const sql =
          'SELECT * FROM users UNION ALL SELECT * FROM admins; DROP TABLE admins; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject multiple UNION with injection', () => {
        const sql =
          'SELECT id FROM users UNION SELECT id FROM orders UNION SELECT id FROM products; DELETE FROM products; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject UNION with nested subquery injection', () => {
        const sql =
          'SELECT * FROM users UNION SELECT * FROM (SELECT * FROM admins; DROP TABLE admins; --) AS sub';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject INTERSECT with injection', () => {
        const sql =
          'SELECT id FROM users INTERSECT SELECT id FROM orders; UPDATE orders SET status="cancelled"; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject EXCEPT with injection', () => {
        const sql =
          'SELECT id FROM users EXCEPT SELECT id FROM banned_users; DROP TABLE banned_users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('CASE statement injections', () => {
      it('should reject CASE with DROP in WHEN clause', () => {
        const sql =
          'SELECT CASE WHEN id > 0 THEN name; DROP TABLE users; -- ELSE email END FROM users';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject CASE with UPDATE in THEN clause', () => {
        const sql =
          'SELECT CASE WHEN age > 18 THEN (UPDATE users SET verified=1) ELSE 0 END FROM users';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject nested CASE with injection', () => {
        const sql =
          'SELECT CASE WHEN id IN (SELECT user_id FROM orders; DELETE FROM orders; --) THEN 1 ELSE 0 END FROM users';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Window function injections', () => {
      it('should reject ROW_NUMBER with DROP in PARTITION BY', () => {
        const sql =
          'SELECT ROW_NUMBER() OVER (PARTITION BY category; DROP TABLE products; -- ORDER BY price) FROM products';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject RANK with injection in ORDER BY', () => {
        const sql =
          'SELECT RANK() OVER (ORDER BY id; DELETE FROM users; --) FROM users';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject window function with subquery injection', () => {
        const sql =
          'SELECT SUM(amount) OVER (PARTITION BY (SELECT 1; DROP TABLE orders; --)) FROM orders';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Blind SQL injection attempts', () => {
      it('should reject time-based blind injection with SLEEP', () => {
        const sql =
          'SELECT * FROM users WHERE id = 1 AND (SELECT SLEEP(5)); DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject time-based blind injection with BENCHMARK', () => {
        const sql =
          'SELECT * FROM users WHERE id = 1 AND (SELECT BENCHMARK(1000000,MD5("test"))); DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject boolean-based blind injection with IF', () => {
        const sql =
          'SELECT * FROM users WHERE id = 1 AND IF((SELECT COUNT(*) FROM users) > 0, (DROP TABLE users), 1)';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject error-based injection with EXTRACTVALUE', () => {
        const sql =
          'SELECT * FROM users WHERE id = 1 AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT password FROM users LIMIT 1))); DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject error-based injection with UPDATEXML', () => {
        const sql =
          'SELECT * FROM users WHERE id = 1 AND UPDATEXML(1, CONCAT(0x7e, (SELECT password FROM admins)), 1); DELETE FROM admins; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Advanced obfuscation techniques', () => {
      it('should reject injection with CONCAT obfuscation', () => {
        const sql =
          'SELECT * FROM users; SET @sql = CONCAT("DR", "OP TA", "BLE users"); PREPARE stmt FROM @sql; EXECUTE stmt; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject injection with CHAR obfuscation', () => {
        const sql =
          'SELECT * FROM users WHERE name = CHAR(97,100,109,105,110); DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject injection with HEX obfuscation', () => {
        const sql = 'SELECT * FROM users WHERE id = 0x31; DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject injection with CONVERT obfuscation', () => {
        const sql =
          'SELECT * FROM users; EXEC(CONVERT(VARCHAR, 0x44524F50205441424C452075736572733B)); --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject injection with base64 encoding attempt', () => {
        const sql =
          'SELECT * FROM users; EXEC FROM_BASE64("RFJPUCBUQUJMRSB1c2Vycw=="); --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject injection with Unicode obfuscation', () => {
        const sql =
          'SELECT * FROM users WHERE name = U&"\\0061\\0064\\006D\\0069\\006E"; DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Transaction-based injections', () => {
      it('should reject BEGIN TRANSACTION with DROP', () => {
        const sql =
          'SELECT * FROM users; BEGIN TRANSACTION; DROP TABLE users; COMMIT; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject START TRANSACTION with DELETE', () => {
        const sql =
          'SELECT * FROM users; START TRANSACTION; DELETE FROM users; COMMIT; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject SAVEPOINT with injection', () => {
        const sql =
          'SELECT * FROM users; SAVEPOINT sp1; UPDATE users SET admin=1; RELEASE SAVEPOINT sp1; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject ROLLBACK with injection', () => {
        const sql =
          'SELECT * FROM users; BEGIN; DROP TABLE users; ROLLBACK; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('JOIN-based injections', () => {
      it('should reject JOIN with DROP in ON clause', () => {
        const sql =
          'SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id; DROP TABLE orders; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject JOIN with subquery injection', () => {
        const sql =
          'SELECT * FROM users u INNER JOIN (SELECT * FROM orders; DELETE FROM orders; --) o ON u.id = o.user_id';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject CROSS JOIN with injection', () => {
        const sql =
          'SELECT * FROM users CROSS JOIN orders; TRUNCATE TABLE orders; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject multiple JOINs with nested injection', () => {
        const sql =
          'SELECT * FROM users u JOIN orders o ON u.id = o.user_id JOIN (SELECT * FROM products; DROP TABLE products; --) p ON o.product_id = p.id';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('HAVING and GROUP BY injections', () => {
      it('should reject HAVING clause with DROP', () => {
        const sql =
          'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 10; DROP TABLE products; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject GROUP BY with subquery injection', () => {
        const sql =
          'SELECT category, COUNT(*) FROM products GROUP BY (SELECT 1; DELETE FROM products; --) HAVING COUNT(*) > 5';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject HAVING with nested subquery', () => {
        const sql =
          'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id HAVING COUNT(*) > (SELECT 1; UPDATE orders SET status="deleted"; --)';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('LIMIT and OFFSET injections', () => {
      it('should reject LIMIT with injection', () => {
        const sql = 'SELECT * FROM users LIMIT 10; DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject OFFSET with injection', () => {
        const sql =
          'SELECT * FROM users LIMIT 10 OFFSET 20; DELETE FROM users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject LIMIT with subquery injection', () => {
        const sql =
          'SELECT * FROM users LIMIT (SELECT 10; DROP TABLE users; --)';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('INTO OUTFILE and DUMPFILE injections', () => {
      it('should reject INTO OUTFILE injection', () => {
        const sql =
          "SELECT * FROM users INTO OUTFILE '/tmp/users.txt'; DROP TABLE users; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject INTO DUMPFILE injection', () => {
        const sql =
          "SELECT password FROM users LIMIT 1 INTO DUMPFILE '/tmp/pass.txt'; DELETE FROM users; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject LOAD DATA INFILE injection', () => {
        const sql =
          "LOAD DATA INFILE '/tmp/malicious.txt' INTO TABLE users; DROP TABLE users; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('View and trigger injections', () => {
      it('should reject CREATE VIEW with injection', () => {
        const sql =
          'SELECT * FROM users; CREATE VIEW admin_view AS SELECT * FROM users WHERE admin=1; DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject CREATE TRIGGER injection', () => {
        const sql =
          'SELECT * FROM users; CREATE TRIGGER malicious BEFORE INSERT ON users FOR EACH ROW DELETE FROM users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject ALTER VIEW injection', () => {
        const sql =
          'SELECT * FROM users; ALTER VIEW user_view AS SELECT * FROM users; DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject DROP VIEW with data loss', () => {
        const sql =
          'SELECT * FROM users; DROP VIEW IF EXISTS important_view; DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject DROP TRIGGER injection', () => {
        const sql =
          'SELECT * FROM users; DROP TRIGGER IF EXISTS audit_trigger; DELETE FROM audit_log; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Index manipulation injections', () => {
      it('should reject CREATE INDEX injection', () => {
        const sql =
          'SELECT * FROM users; CREATE INDEX idx_malicious ON users(email); DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject DROP INDEX injection', () => {
        const sql =
          'SELECT * FROM users; DROP INDEX idx_important ON users; DELETE FROM users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject ALTER INDEX injection', () => {
        const sql =
          'SELECT * FROM users; ALTER INDEX idx_users RENAME TO idx_hacked; TRUNCATE TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('User and permission injections', () => {
      it('should reject CREATE USER injection', () => {
        const sql =
          "SELECT * FROM users; CREATE USER 'attacker'@'localhost' IDENTIFIED BY 'pass123'; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject DROP USER injection', () => {
        const sql = "SELECT * FROM users; DROP USER 'admin'@'localhost'; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject ALTER USER injection', () => {
        const sql =
          "SELECT * FROM users; ALTER USER 'root'@'localhost' IDENTIFIED BY 'hacked'; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject REVOKE privileges injection', () => {
        const sql =
          "SELECT * FROM users; REVOKE ALL PRIVILEGES ON *.* FROM 'admin'@'localhost'; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject SET PASSWORD injection', () => {
        const sql =
          "SELECT * FROM users; SET PASSWORD FOR 'root'@'localhost' = PASSWORD('hacked'); --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('System command injections', () => {
      it('should reject xp_cmdshell injection (MSSQL)', () => {
        const sql =
          "SELECT * FROM users; EXEC xp_cmdshell 'net user attacker password /add'; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject LOAD_FILE injection (MySQL)', () => {
        const sql =
          "SELECT * FROM users WHERE password = LOAD_FILE('/etc/passwd'); DROP TABLE users; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject sys_exec injection', () => {
        const sql = "SELECT * FROM users; EXEC sys_exec('rm -rf /'); --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });

    describe('Prepared statement injections', () => {
      it('should reject PREPARE statement injection', () => {
        const sql =
          "SELECT * FROM users; PREPARE stmt FROM 'DROP TABLE users'; EXECUTE stmt; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject EXECUTE IMMEDIATE injection', () => {
        const sql =
          "SELECT * FROM users; EXECUTE IMMEDIATE 'DELETE FROM users WHERE 1=1'; --";
        expect(validateSqlIsQuery(sql)).toBe(false);
      });

      it('should reject DEALLOCATE with injection', () => {
        const sql =
          'SELECT * FROM users; DEALLOCATE PREPARE stmt; DROP TABLE users; --';
        expect(validateSqlIsQuery(sql)).toBe(false);
      });
    });
  });
});
