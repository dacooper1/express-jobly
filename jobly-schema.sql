\c jobly
CREATE TABLE companies(
  handle varchar(25) PRIMARY KEY CHECK (handle = lower(handle)),
  name text UNIQUE NOT NULL,
  num_employees integer CHECK (num_employees >= 0),
  description text NOT NULL,
  logo_url text
);

CREATE TABLE users(
  username varchar(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL CHECK (position('@' IN email) > 1),
  is_admin boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE jobs(
  id serial PRIMARY KEY,
  title text NOT NULL,
  salary integer CHECK (salary >= 0),
  equity numeric CHECK (equity <= 1.0),
  company_handle varchar(25) NOT NULL REFERENCES companies ON DELETE CASCADE
);

CREATE TABLE applications(
  username varchar(25) REFERENCES users ON DELETE CASCADE,
  job_id integer REFERENCES jobs ON DELETE CASCADE,
  PRIMARY KEY (username, job_id)
);

