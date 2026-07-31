SELECT 'CREATE DATABASE auth_bn'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_bn')\gexec

SELECT 'CREATE DATABASE master_bn'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'master_bn')\gexec

SELECT 'CREATE DATABASE academic_bn'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'academic_bn')\gexec

SELECT 'CREATE DATABASE internship_bn'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'internship_bn')\gexec

SELECT 'CREATE DATABASE learn'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'learn')\gexec
