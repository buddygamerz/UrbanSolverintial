-- UrbanSolver Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_priority AS ENUM ('low', 'moderate', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables (these will be managed by SQLAlchemy/Alembic in production)
-- This is just for reference and initial setup

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    city VARCHAR(100),
    ward VARCHAR(100),
    locality VARCHAR(100),
    geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index on locations
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    severity issue_priority NOT NULL DEFAULT 'moderate',
    description TEXT NOT NULL,
    impact_description TEXT,
    issue_id UUID REFERENCES issues(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report media table
CREATE TABLE IF NOT EXISTS report_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity issue_priority NOT NULL,
    priority_score DOUBLE PRECISION,
    status issue_status DEFAULT 'open',
    recurrence INTEGER DEFAULT 0,
    affected_population_estimate INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issue status history
CREATE TABLE IF NOT EXISTS issue_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    status issue_status NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES users(id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    authority VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    contractor VARCHAR(255),
    estimated_cost DOUBLE PRECISION,
    start_date TIMESTAMP WITH TIME ZONE,
    expected_completion TIMESTAMP WITH TIME ZONE,
    current_status VARCHAR(50) NOT NULL,
    geographic_coverage TEXT,
    stated_objective TEXT,
    affected_areas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project documents
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project impact analysis
CREATE TABLE IF NOT EXISTS project_impact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES issues(id),
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    evidence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES issues(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    expected_benefit TEXT,
    risks TEXT,
    complexity VARCHAR(20),
    estimated_cost DOUBLE PRECISION,
    stakeholders TEXT,
    evidence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence sources
CREATE TABLE IF NOT EXISTS evidence_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    retrieval_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supporting_text TEXT,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issue-Project many-to-many link table
CREATE TABLE IF NOT EXISTS issue_project_links (
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, project_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(location_id);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority_score ON issues(priority_score);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(current_status);
CREATE INDEX IF NOT EXISTS idx_evidence_sources_issue ON evidence_sources(issue_id);

-- Insert demo data for Bengaluru
INSERT INTO users (id, email, password_hash, status) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'demo@urbansolver.org', '$2b$12$dummy_hash_for_demo', 'active')
ON CONFLICT (email) DO NOTHING;

-- Demo locations in Bengaluru
INSERT INTO locations (id, latitude, longitude, address, city, ward, locality) VALUES
    ('11111111-1111-1111-1111-111111111111', 12.9716, 77.5946, 'Majestic, Bengaluru', 'Bengaluru', 'Ward 101', 'Majestic'),
    ('22222222-2222-2222-2222-222222222222', 12.9750, 77.6050, 'MG Road, Bengaluru', 'Bengaluru', 'Ward 102', 'MG Road'),
    ('33333333-3333-3333-3333-333333333333', 12.9650, 77.5850, 'Cubbon Park, Bengaluru', 'Bengaluru', 'Ward 103', 'Cubbon Park'),
    ('44444444-4444-4444-4444-444444444444', 12.9150, 77.6250, 'Silk Board Junction, Bengaluru', 'Bengaluru', 'Ward 104', 'Silk Board'),
    ('55555555-5555-5555-5555-555555555555', 12.9300, 77.6100, 'Koramangala, Bengaluru', 'Bengaluru', 'Ward 105', 'Koramangala')
ON CONFLICT (id) DO NOTHING;

-- Demo reports
INSERT INTO reports (id, location_id, reporter_id, category, severity, description, impact_description) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'waterlogging', 'critical', 'Severe waterlogging at Majestic bus stand after heavy rain', 'Buses cannot operate, pedestrians forced to walk through knee-deep water'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'pothole', 'high', 'Large pothole on MG Road near Metro station', 'Two-wheeler accidents reported, traffic slowed significantly'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'footpath', 'moderate', 'Broken footpath tiles near Cubbon Park entrance', 'Elderly and children at risk of tripping'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'congestion', 'high', 'Severe traffic congestion at Silk Board junction during peak hours', 'Commute time increased by 45 minutes, air pollution spike'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'drainage', 'moderate', 'Blocked storm drain in Koramangala 4th Block', 'Water accumulates on road during rain, mosquito breeding')
ON CONFLICT (id) DO NOTHING;

-- Demo issues (clustered)
INSERT INTO issues (id, title, description, category, severity, priority_score, status, recurrence, affected_population_estimate) VALUES
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Recurring Waterlogging at Majestic', 'Multiple reports of severe waterlogging at Majestic bus stand area after moderate to heavy rainfall', 'waterlogging', 'critical', 91.5, 'open', 23, 50000),
    ('11111111-1111-1111-1111-111111111112', 'MG Road Pothole Cluster', 'Several potholes reported along MG Road stretch', 'pothole', 'high', 78.2, 'in_progress', 12, 25000),
    ('22222222-2222-2222-2222-222222222223', 'Silk Board Junction Congestion', 'Chronic traffic congestion at Silk Board junction affecting multiple routes', 'congestion', 'high', 85.7, 'open', 156, 100000)
ON CONFLICT (id) DO NOTHING;

-- Link reports to issues
INSERT INTO issue_project_links (issue_id, project_id) VALUES 
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'pppppppp-pppp-pppp-pppp-pppppppppppp')
ON CONFLICT DO NOTHING;

-- Demo projects
INSERT INTO projects (id, name, authority, department, contractor, estimated_cost, start_date, expected_completion, current_status, stated_objective, geographic_coverage) VALUES
    ('pppppppp-pppp-pppp-pppp-pppppppppppp', 'Majestic Area Stormwater Drain Upgrade', 'BBMP', 'Stormwater Drain Department', 'XYZ Constructions', 150000000, '2024-01-15', '2024-12-31', 'underway', 'Upgrade stormwater drainage capacity in Majestic area to prevent waterlogging', '{"type": "Polygon", "coordinates": [[[77.5900, 12.9680], [77.5990, 12.9680], [77.5990, 12.9750], [77.5900, 12.9750], [77.5900, 12.9680]]]}'),
    ('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'MG Road Resurfacing Project', 'BBMP', 'Road Infrastructure', 'ABC Builders', 80000000, '2024-03-01', '2024-08-31', 'planning', 'Complete resurfacing of MG Road from Trinity Circle to Anil Kumble Circle', '{"type": "LineString", "coordinates": [[77.6050, 12.9750], [77.6100, 12.9700]]}'),
    ('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'Silk Board Junction Grade Separator', 'BDA', 'Traffic Engineering', 'PQR Infra', 500000000, '2023-06-01', '2025-06-30', 'underway', 'Construct grade separator to ease traffic flow at Silk Board junction', '{"type": "Point", "coordinates": [77.6250, 12.9150]}')
ON CONFLICT (id) DO NOTHING;

-- Demo project impact analysis
INSERT INTO project_impact (id, project_id, issue_id, description, type, evidence) VALUES
    ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Project directly addresses the drainage capacity issue causing waterlogging at Majestic', 'intended', 'BBMP DPR Section 4.2'),
    ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Project timeline extends to Dec 2024, leaving monsoon 2024 without full protection', 'gap', 'Project schedule'),
    ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', '22222222-2222-2222-2222-222222222223', 'Grade separator may shift congestion to adjacent roads during construction', 'unintended_consequence', 'Traffic impact assessment report')
ON CONFLICT (id) DO NOTHING;

-- Demo recommendations
INSERT INTO recommendations (id, project_id, issue_id, title, description, expected_benefit, risks, complexity, estimated_cost, stakeholders) VALUES
    ('llllllll-llll-llll-llll-llllllllllll', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Install temporary pumps for monsoon 2024', 'Deploy mobile pump units at low-lying points until drain upgrade completes', 'Immediate relief during monsoon', 'Operational cost, maintenance', 'low', 5000000, 'BBMP, Traffic Police'),
    ('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', '22222222-2222-2222-2222-222222222223', 'Adaptive signal timing on adjacent roads', 'Implement smart traffic signals on Hosur Road and Bommanahalli stretch', 'Reduce spillover congestion', 'Requires coordination', 'medium', 20000000, 'BDA, Traffic Police, BBMP')
ON CONFLICT (id) DO NOTHING;

-- Demo evidence sources
INSERT INTO evidence_sources (id, issue_id, source_type, url, supporting_text, confidence) VALUES
    ('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'government_document', 'https://bbmp.gov.in/documents/dpr-majestic-drain.pdf', 'DPR confirms drainage capacity deficit of 40% in Majestic catchment', 0.95),
    ('oooooooo-oooo-oooo-oooo-oooooooooooo', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'citizen_report', 'https://twitter.com/user/status/12345', '23 independent reports over 11 months', 0.9),
    ('pppppppp-pppp-pppp-pppp-ppppppppppp2', '11111111-1111-1111-1111-111111111112', 'openstreetmap', 'https://www.openstreetmap.org/way/123456', 'Road condition tagged as bad', 0.7)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;