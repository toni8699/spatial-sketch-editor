CREATE TABLE IF NOT EXISTS publications (
	project_id text PRIMARY KEY REFERENCES projects(id),
	public_id uuid NOT NULL UNIQUE,
	active_version integer NULL CHECK (active_version IS NULL OR active_version > 0),
	revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS releases (
	project_id text NOT NULL,
	version integer NOT NULL CHECK (version > 0),
	manifest jsonb NOT NULL CHECK (jsonb_typeof(manifest) = 'object'),
	created_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (project_id, version),
	FOREIGN KEY (project_id, version) REFERENCES project_versions(project_id, version)
);
