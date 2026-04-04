USE legal_advisor;

CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO templates (title, description, category) VALUES 
('Freelance Contract', 'Standard terms for independent creative work.', 'Business'),
('Roommate Agreement', 'Set rules for shared living spaces.', 'Personal'),
('Commercial Lease', 'Rent agreement for office or retail space.', 'Real Estate');