CREATE DATABASE IF NOT EXISTS hcp_crm;
USE hcp_crm;

CREATE TABLE IF NOT EXISTS hcps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  institution VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  hcp_id INT NULL,
  hcp_name VARCHAR(255),
  interaction_type VARCHAR(50) DEFAULT 'Meeting',
  interaction_date DATE,
  interaction_time TIME,
  attendees TEXT,
  topics_discussed TEXT,
  materials_shared TEXT,
  samples_distributed TEXT,
  sentiment VARCHAR(20) DEFAULT 'Neutral',
  outcomes TEXT,
  followup_actions TEXT,
  ai_suggested_followups TEXT,
  raw_chat_input TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hcp_id) REFERENCES hcps(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  interaction_id INT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS user_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  route VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hcps (name, specialty, institution)
SELECT 'Dr. Smith', 'Oncology', 'City Medical Center'
WHERE NOT EXISTS (SELECT 1 FROM hcps WHERE name = 'Dr. Smith');

INSERT INTO hcps (name, specialty, institution)
SELECT 'Dr. Patel', 'Cardiology', 'Apollo Hospital'
WHERE NOT EXISTS (SELECT 1 FROM hcps WHERE name = 'Dr. Patel');

INSERT INTO hcps (name, specialty, institution)
SELECT 'Dr. Johnson', 'Neurology', 'National Brain Institute'
WHERE NOT EXISTS (SELECT 1 FROM hcps WHERE name = 'Dr. Johnson');

INSERT INTO hcps (name, specialty, institution)
SELECT 'Dr. Williams', 'Endocrinology', 'Metro Clinic'
WHERE NOT EXISTS (SELECT 1 FROM hcps WHERE name = 'Dr. Williams');

INSERT INTO hcps (name, specialty, institution)
SELECT 'Dr. Brown', 'Pulmonology', 'Chest & Lung Hospital'
WHERE NOT EXISTS (SELECT 1 FROM hcps WHERE name = 'Dr. Brown');
